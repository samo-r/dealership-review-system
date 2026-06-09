/* jshint esversion: 8, sub: true */
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
  const hex = process.env.CHASSIS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(
      "CHASSIS_ENCRYPTION_KEY must be 64 hex characters (32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
};

const validateEncryptionKey = () => {
  getEncryptionKey();
};

const normalizeChassis = (raw) => {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
};

const chassisEquals = (left, right) => {
  const bufLeft = Buffer.from(left, "utf8");
  const bufRight = Buffer.from(right, "utf8");
  if (bufLeft.length !== bufRight.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufLeft, bufRight);
};

const encryptChassis = (raw) => {
  const normalized = normalizeChassis(raw);
  if (!normalized) {
    throw new Error("Chassis number is required.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
};

const decryptChassis = (storedBlob) => {
  const key = getEncryptionKey();
  const data = Buffer.from(storedBlob, "base64");

  if (data.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted chassis payload.");
  }

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
};

const verifyChassis = async (rawInput, dealerId, Inventory) => {
  const normalized = normalizeChassis(rawInput);
  if (!normalized) {
    return { verified: false };
  }

  const vehicles = await Inventory.find({ dealer_id: dealerId });
  for (const vehicle of vehicles) {
    if (!vehicle.chassis_number) {
      continue;
    }
    try {
      const decrypted = decryptChassis(vehicle.chassis_number);
      if (chassisEquals(decrypted, normalized)) {
        return { verified: true, vehicleId: vehicle._id };
      }
    } catch (_error) {
      // Skip records with corrupt ciphertext.
    }
  }

  return { verified: false };
};

const isDuplicateChassis = async (
  raw,
  dealerId,
  Inventory,
  excludeVehicleId = null,
) => {
  const normalized = normalizeChassis(raw);
  if (!normalized) {
    return false;
  }

  const vehicles = await Inventory.find({ dealer_id: dealerId });
  for (const vehicle of vehicles) {
    if (
      excludeVehicleId &&
      String(vehicle._id) === String(excludeVehicleId)
    ) {
      continue;
    }
    if (!vehicle.chassis_number) {
      continue;
    }
    try {
      const decrypted = decryptChassis(vehicle.chassis_number);
      if (chassisEquals(decrypted, normalized)) {
        return true;
      }
    } catch (_error) {
      continue;
    }
  }

  return false;
};

const stripChassisFromVehicle = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.chassis_number;
  return obj;
};

module.exports = {
  validateEncryptionKey,
  normalizeChassis,
  encryptChassis,
  decryptChassis,
  verifyChassis,
  isDuplicateChassis,
  stripChassisFromVehicle,
};
