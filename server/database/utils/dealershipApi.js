/* jshint esversion: 8, sub: true */

const formatDealershipForApi = (doc) => {
  const record = doc && doc.toObject ? doc.toObject() : { ...doc };
  const dealerId = record.dealer_id ?? record.id;
  const name = record.name || record.full_name || "";

  return {
    dealer_id: dealerId,
    name,
    tin: record.tin || "",
    district: record.district || record.city || "",
    physical_address: record.physical_address || record.address || "",
    email: record.email || "",
    // Compatibility aliases for existing clients.
    id: dealerId,
    full_name: name,
    short_name: name.split(/\s+/).slice(0, 2).join(" "),
    city: record.district || record.city || "",
    state: "Uganda",
    address: record.physical_address || record.address || "",
    zip: "",
  };
};

const mapSeedDealership = (record) => ({
  dealer_id: Number(record.dealer_id ?? record.id),
  name: String(record.name).trim(),
  tin: String(record.tin).trim(),
  district: String(record.district).trim(),
  physical_address: String(record.physical_address).trim(),
  email: String(record.email).trim(),
});

const mapLegacyUpdatePayload = (body) => {
  const updates = {};

  if (body.name !== undefined) {
    updates.name = String(body.name).trim();
  } else if (body.full_name !== undefined) {
    updates.name = String(body.full_name).trim();
  }

  if (body.tin !== undefined) {
    updates.tin = String(body.tin).trim();
  }

  if (body.district !== undefined) {
    updates.district = String(body.district).trim();
  } else if (body.city !== undefined) {
    updates.district = String(body.city).trim();
  }

  if (body.physical_address !== undefined) {
    updates.physical_address = String(body.physical_address).trim();
  } else if (body.address !== undefined) {
    updates.physical_address = String(body.address).trim();
  } else if (body.location !== undefined) {
    updates.physical_address = String(body.location).trim();
  }

  if (body.email !== undefined) {
    updates.email = String(body.email).trim();
  }

  return updates;
};

module.exports = {
  formatDealershipForApi,
  mapSeedDealership,
  mapLegacyUpdatePayload,
};
