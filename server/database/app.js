/* jshint esversion: 8, sub: true */
const express = require("express");
const path = require("path");

// In Docker, env vars come from Compose `environment` / `env_file` on the host.
// dotenv only supplements local `npm start` when database/.env exists on disk.
const dotenvResult = require("dotenv").config({
  path: path.join(__dirname, ".env"),
});
if (dotenvResult.error && !process.env.PORT) {
  console.warn(
    "[bootstrap] No database/.env file found; relying on process environment variables.",
  );
}
const mongoose = require("mongoose");
const fs = require("fs");
const cors = require("cors");
const app = express();
let httpServer;
let isShuttingDown = false;

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || String(value).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const PORT = Number(requireEnv("PORT"));
const MONGODB_URI = requireEnv("MONGODB_URI");
const DB_NAME = requireEnv("DB_NAME");
const CORS_ORIGIN = requireEnv("CORS_ORIGIN");
const SEED_ON_START =
  requireEnv("SEED_ON_START").toLowerCase() === "true";
const INTERNAL_API_KEY = requireEnv("INTERNAL_API_KEY");

const SENTIMENT_LABELS = new Set(["positive", "neutral", "negative"]);
const SENTIMENT_STATUSES = new Set(["pending", "completed", "failed"]);

// Configure Mongo connection timeouts and monitor connection lifecycle events.
const MONGODB_OPTIONS = {
  dbName: DB_NAME,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

mongoose.connection.on("connected", () => {
  console.log(`MongoDB connected: ${DB_NAME}`);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(require("body-parser").urlencoded({ extended: false }));

const reviews_data = JSON.parse(
  fs.readFileSync(require("path").join(__dirname, "data", "reviews.json"), "utf8"),
);
const dealerships_data = JSON.parse(
  fs.readFileSync(require("path").join(__dirname, "data", "dealerships.json"), "utf8"),
);

const Reviews = require("./review");
const Dealerships = require("./dealership");
const Inventory = require("./inventory");
const {
  validateEncryptionKey,
  encryptChassis,
  verifyChassis,
  isDuplicateChassis,
  stripChassisFromVehicle,
} = require("./utils/chassisEncryption");

// Atomic ID generation for review inserts.
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);
const Counter = mongoose.model("Counter", CounterSchema, "counters");

const getNextReviewId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "reviews" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
};

const syncReviewCounter = async () => {
  const maxReview = await Reviews.findOne().sort({ id: -1 }).select({ id: 1 });
  const maxReviewId = maxReview ? maxReview.id : 0;

  await Counter.updateOne(
    { _id: "reviews" },
    { $max: { seq: maxReviewId } },
    { upsert: true },
  );

  console.log(`[bootstrap] Review ID counter synced to at least ${maxReviewId}`);
};

const getNextDealershipId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "dealerships" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
};

const syncDealershipCounter = async () => {
  const maxDealer = await Dealerships.findOne().sort({ id: -1 }).select({ id: 1 });
  const maxDealerId = maxDealer ? maxDealer.id : 0;

  await Counter.updateOne(
    { _id: "dealerships" },
    { $max: { seq: maxDealerId } },
    { upsert: true },
  );

  console.log(`[bootstrap] Dealership ID counter synced to at least ${maxDealerId}`);
};

const validateDealershipPayload = (data) => {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Request body must be a JSON object." };
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const location = typeof data.location === "string" ? data.location.trim() : "";
  const contactNumber =
    typeof data.contact_number === "string" ? data.contact_number.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";

  if (!name) {
    return { valid: false, message: "Field 'name' is required." };
  }
  if (!location) {
    return { valid: false, message: "Field 'location' is required." };
  }
  if (!contactNumber) {
    return { valid: false, message: "Field 'contact_number' is required." };
  }
  if (!email) {
    return { valid: false, message: "Field 'email' is required." };
  }

  const shortName = name.split(/\s+/).slice(0, 2).join(" ");

  return {
    valid: true,
    dealership: {
      name,
      location,
      contact_number: contactNumber,
      email,
      full_name: name,
      short_name: shortName,
      address: location,
      city: location,
      state: "Uganda",
      zip: "00000",
      lat: "0",
      long: "0",
    },
  };
};

// Step 3.4: Validate and normalize incoming review payloads before DB writes.
const validateReviewPayload = (data) => {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Request body must be a JSON object." };
  }

  const requiredTextFields = [
    "name",
    "review",
    "purchase_date",
    "car_make",
    "car_model",
  ];

  for (const field of requiredTextFields) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      return {
        valid: false,
        message: `Field '${field}' is required.`,
      };
    }
  }

  const dealership = Number(data.dealership);
  if (!Number.isInteger(dealership) || dealership <= 0) {
    return {
      valid: false,
      message: "Field 'dealership' is required.",
    };
  }

  const carYear = Number(data.car_year);
  if (!Number.isInteger(carYear) || carYear < 1886) {
    return {
      valid: false,
      message: "Field 'car_year' is required.",
    };
  }

  let purchase = data.purchase;
  if (typeof purchase === "string") {
    if (purchase.toLowerCase() === "true") {
      purchase = true;
    } else if (purchase.toLowerCase() === "false") {
      purchase = false;
    }
  }

  if (typeof purchase !== "boolean") {
    return {
      valid: false,
      message: "Field 'purchase' is required.",
    };
  }

  let authorId = null;
  if (data.author_id !== undefined && data.author_id !== null && data.author_id !== "") {
    authorId = Number(data.author_id);
    if (!Number.isInteger(authorId) || authorId <= 0) {
      return {
        valid: false,
        message: "Field 'author_id' must be a positive integer when provided.",
      };
    }
  }

  let authorUsername = null;
  if (typeof data.author_username === "string" && data.author_username.trim() !== "") {
    authorUsername = data.author_username.trim();
  }

  return {
    valid: true,
    normalized: {
      name: data.name.trim(),
      dealership,
      review: data.review.trim(),
      purchase,
      purchase_date: data.purchase_date.trim(),
      car_make: data.car_make.trim(),
      car_model: data.car_model.trim(),
      car_year: carYear,
      author_id: authorId,
      author_username: authorUsername,
    },
  };
};

const requireInternalApiKey = (req, res, next) => {
  const providedKey = req.headers["x-internal-api-key"];
  if (!providedKey || providedKey !== INTERNAL_API_KEY) {
    return sendError(res, 403, "FORBIDDEN", "Invalid or missing internal API key.");
  }
  return next();
};

const validateSentimentPatchPayload = (data) => {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Request body must be a JSON object." };
  }

  const updates = {};

  if (data.sentiment_status !== undefined) {
    if (!SENTIMENT_STATUSES.has(data.sentiment_status)) {
      return {
        valid: false,
        message: "Field 'sentiment_status' must be pending, completed, or failed.",
      };
    }
    updates.sentiment_status = data.sentiment_status;
  }

  if (data.sentiment !== undefined) {
    if (data.sentiment !== null && !SENTIMENT_LABELS.has(data.sentiment)) {
      return {
        valid: false,
        message: "Field 'sentiment' must be positive, neutral, negative, or null.",
      };
    }
    updates.sentiment = data.sentiment;
  }

  if (data.sentiment_analyzed_at !== undefined) {
    if (data.sentiment_analyzed_at !== null) {
      const parsed = new Date(data.sentiment_analyzed_at);
      if (Number.isNaN(parsed.getTime())) {
        return {
          valid: false,
          message: "Field 'sentiment_analyzed_at' must be a valid ISO date or null.",
        };
      }
      updates.sentiment_analyzed_at = parsed;
    } else {
      updates.sentiment_analyzed_at = null;
    }
  }

  if (data.sentiment_error !== undefined) {
    if (data.sentiment_error !== null && typeof data.sentiment_error !== "string") {
      return {
        valid: false,
        message: "Field 'sentiment_error' must be a string or null.",
      };
    }
    updates.sentiment_error =
      typeof data.sentiment_error === "string" ? data.sentiment_error.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return {
      valid: false,
      message: "At least one sentiment field must be provided.",
    };
  }

  return { valid: true, updates };
};

// Standard error response shape for all API failures.
const sendError = (res, status, code, message, details = undefined) => {
  const payload = {
    error: {
      code,
      message,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};

// Step 3.3: Enforce id uniqueness at database level for seeded and runtime writes.
const ensureDatabaseIndexes = async () => {
  await Reviews.collection.createIndex({ id: 1 }, { unique: true });
  await Dealerships.collection.createIndex({ id: 1 }, { unique: true });
  console.log("[bootstrap] Ensured unique indexes on reviews.id and dealerships.id");
};

// Seed helper used during startup only when seeding is enabled.
// Keeps startup idempotent by inserting data only if collections are empty.
const seedDatabase = async () => {
  const reviewsCount = await Reviews.countDocuments();
  const dealershipsCount = await Dealerships.countDocuments();

  if (reviewsCount === 0) {
    await Reviews.insertMany(reviews_data.reviews);
    console.log(`Seeded ${reviews_data.reviews.length} review documents.`);
  } else {
    console.log("Reviews collection already has data; skipping seed.");
  }

  if (dealershipsCount === 0) {
    await Dealerships.insertMany(dealerships_data.dealerships);
    console.log(`Seeded ${dealerships_data.dealerships.length} dealership documents.`);
  } else {
    console.log("Dealerships collection already has data; skipping seed.");
  }
};

// Graceful shutdown handler to close HTTP server and MongoDB cleanly.
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new traffic immediately while in-flight requests complete.
  if (httpServer) {
    httpServer.keepAliveTimeout = 1;
    httpServer.headersTimeout = 1000;
  }

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      console.log("HTTP server closed.");
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Express route to home
app.get("/", async (req, res) => {
  res.send("Welcome to the Mongoose API");
});

// Readiness endpoint for service checks (API health + Mongo connection state).
app.get("/health", (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: "draining",
      service: "database-api",
      database: {
        name: DB_NAME,
        state: "disconnecting",
      },
    });
  }

  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const mongoState = mongoose.connection.readyState;
  const isReady = mongoState === 1;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "degraded",
    service: "database-api",
    database: {
      name: DB_NAME,
      state: mongoStateMap[mongoState] || "unknown",
    },
  });
});

// Express route to fetch all reviews
app.get("/fetchReviews", async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    sendError(res, 500, "FETCH_REVIEWS_FAILED", "Failed to fetch reviews.");
  }
});

// Express route to fetch reviews by a particular dealer
app.get("/fetchReviews/dealer/:id", async (req, res) => {
  const dealerId = Number(req.params.id);
  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return sendError(
      res,
      400,
      "INVALID_DEALER_ID",
      "Dealer id must be a positive integer.",
    );
  }

  try {
    const documents = await Reviews.find({ dealership: dealerId });
    res.json(documents);
  } catch (error) {
    sendError(
      res,
      500,
      "FETCH_DEALER_REVIEWS_FAILED",
      "Failed to fetch dealer reviews.",
    );
  }
});

// Express route to fetch all dealerships
app.get("/fetchDealers", async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    sendError(res, 500, "FETCH_DEALERS_FAILED", "Failed to fetch dealers.");
  }
});

// Express route to fetch Dealers by a particular state
app.get("/fetchDealers/:state", async (req, res) => {
  try {
    const documents = await Dealerships.find({ state: req.params.state });
    res.json(documents);
  } catch (error) {
    sendError(
      res,
      500,
      "FETCH_DEALERS_BY_STATE_FAILED",
      "Failed to fetch dealers by state.",
    );
  }
});

// Express route to fetch dealer by a particular id
app.get("/fetchDealer/:id", async (req, res) => {
  const dealerId = Number(req.params.id);
  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return sendError(
      res,
      400,
      "INVALID_DEALER_ID",
      "Dealer id must be a positive integer.",
    );
  }

  try {
    const documents = await Dealerships.find({ id: dealerId });
    if (!documents || documents.length === 0) {
      return sendError(
        res,
        404,
        "DEALER_NOT_FOUND",
        "Dealer not found.",
      );
    }

    return res.json(documents);
  } catch (error) {
    return sendError(
      res,
      500,
      "FETCH_DEALER_FAILED",
      "Failed to fetch dealer.",
    );
  }
});

// POST /insertDealer — register a new dealership (admin onboarding)
app.post("/insertDealer", async (req, res) => {
  const validation = validateDealershipPayload(req.body);
  if (!validation.valid) {
    return sendError(res, 400, "INVALID_DEALERSHIP", validation.message);
  }

  try {
    const nextId = await getNextDealershipId();
    const payload = {
      id: nextId,
      ...validation.dealership,
    };

    const created = await Dealerships.create(payload);
    return res.status(201).json({
      status: 201,
      message: "Dealership created.",
      dealership: created,
      dealership_id: created.id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "DUPLICATE_DEALERSHIP_ID", "Dealership id conflict.");
    }
    return sendError(res, 500, "INSERT_DEALER_FAILED", "Failed to create dealership.");
  }
});

// Express route to update a dealership by id
app.put("/updateDealer/:id", async (req, res) => {
  const dealerId = Number(req.params.id);
  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return sendError(
      res,
      400,
      "INVALID_DEALER_ID",
      "Dealer id must be a valid ID.",
    );
  }

  const allowedFields = [
    "city",
    "state",
    "address",
    "zip",
    "lat",
    "long",
    "short_name",
    "full_name",
    "contact_number",
    "email",
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return sendError(
      res,
      400,
      "NO_UPDATE_FIELDS",
      "At least one updatable field must be provided.",
    );
  }

  try {
    const updated = await Dealerships.findOneAndUpdate(
      { id: dealerId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return sendError(res, 404, "DEALER_NOT_FOUND", "Dealer not found.");
    }
    return res.json(updated);
  } catch (error) {
    return sendError(
      res,
      500,
      "UPDATE_DEALER_FAILED",
      "Failed to update dealer.",
    );
  }
});

//Express route to insert review
app.post("/insert_review", async (req, res) => {
  const validation = validateReviewPayload(req.body);
  if (!validation.valid) {
    return sendError(
      res,
      400,
      "INVALID_REVIEW_PAYLOAD",
      validation.message,
    );
  }

  const data = validation.normalized;
  const dealershipExists = await Dealerships.exists({ id: data.dealership });
  if (!dealershipExists) {
    return sendError(
      res,
      404,
      "DEALERSHIP_NOT_FOUND",
      "Cannot insert review for a dealership that does not exist.",
    );
  }

  const new_id = await getNextReviewId();

  const review = new Reviews({
    id: new_id,
    name: data.name,
    dealership: data.dealership,
    review: data.review,
    purchase: data.purchase,
    purchase_date: data.purchase_date,
    car_make: data.car_make,
    car_model: data.car_model,
    car_year: data.car_year,
    author_id: data.author_id,
    author_username: data.author_username,
    sentiment: null,
    sentiment_status: "pending",
    sentiment_analyzed_at: null,
    sentiment_error: null,
  });

  try {
    const savedReview = await review.save();
    console.log(
      `[sentiment] review_id=${savedReview.id} status=PENDING (insert_review)`,
    );
    return res.status(201).json(savedReview);
  } catch (error) {
    if (error && error.code === 11000) {
      return sendError(
        res,
        409,
        "DUPLICATE_REVIEW_ID",
        "Duplicate review id detected. Please retry request.",
      );
    }
    console.log(error);
    return sendError(
      res,
      500,
      "INSERT_REVIEW_FAILED",
      "Failed to insert review.",
    );
  }
});

// Express route to fetch a single review by id
app.get("/fetchReview/:id", async (req, res) => {
  const reviewId = Number(req.params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return sendError(res, 400, "INVALID_REVIEW_ID", "Review id must be a positive integer.");
  }

  try {
    const document = await Reviews.findOne({ id: reviewId });
    if (!document) {
      return sendError(res, 404, "REVIEW_NOT_FOUND", "Review not found.");
    }
    return res.json(document);
  } catch (error) {
    return sendError(res, 500, "FETCH_REVIEW_FAILED", "Failed to fetch review.");
  }
});

// Express route to update a review by id
app.put("/updateReview/:id", async (req, res) => {
  const reviewId = Number(req.params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return sendError(res, 400, "INVALID_REVIEW_ID", "Review id must be a positive integer.");
  }

  const allowedFields = ["review", "purchase", "purchase_date", "car_make", "car_model", "car_year"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "NO_UPDATE_FIELDS", "At least one updatable field must be provided.");
  }

  if (updates.review !== undefined) {
    updates.sentiment = null;
    updates.sentiment_status = "pending";
    updates.sentiment_analyzed_at = null;
    updates.sentiment_error = null;
    console.log(
      `[sentiment] review_id=${reviewId} status=PENDING (review text updated)`,
    );
  }

  try {
    const updated = await Reviews.findOneAndUpdate(
      { id: reviewId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return sendError(res, 404, "REVIEW_NOT_FOUND", "Review not found.");
    }
    return res.json(updated);
  } catch (error) {
    return sendError(res, 500, "UPDATE_REVIEW_FAILED", "Failed to update review.");
  }
});

// Internal route for sentiment worker to persist analysis results
app.patch("/updateReview/:id/sentiment", requireInternalApiKey, async (req, res) => {
  const reviewId = Number(req.params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return sendError(res, 400, "INVALID_REVIEW_ID", "Review id must be a positive integer.");
  }

  const validation = validateSentimentPatchPayload(req.body);
  if (!validation.valid) {
    return sendError(res, 400, "INVALID_SENTIMENT_PAYLOAD", validation.message);
  }

  try {
    const updated = await Reviews.findOneAndUpdate(
      { id: reviewId },
      { $set: validation.updates },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return sendError(res, 404, "REVIEW_NOT_FOUND", "Review not found.");
    }

    const nextStatus = validation.updates.sentiment_status;
    if (nextStatus === "completed") {
      console.log(
        `[sentiment] review_id=${reviewId} status=COMPLETED label=${validation.updates.sentiment} (patch)`,
      );
    } else if (nextStatus === "failed") {
      console.warn(
        `[sentiment] review_id=${reviewId} status=FAILED (patch) ${validation.updates.sentiment_error || ""}`,
      );
    } else if (nextStatus === "pending") {
      console.log(
        `[sentiment] review_id=${reviewId} status=PENDING (patch)`,
      );
    }

    return res.json(updated);
  } catch (error) {
    return sendError(res, 500, "UPDATE_SENTIMENT_FAILED", "Failed to update review sentiment.");
  }
});

// Express route to delete a review by id
app.delete("/deleteReview/:id", async (req, res) => {
  const reviewId = Number(req.params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return sendError(res, 400, "INVALID_REVIEW_ID", "Review id must be a positive integer.");
  }

  try {
    const deleted = await Reviews.findOneAndDelete({ id: reviewId });
    if (!deleted) {
      return sendError(res, 404, "REVIEW_NOT_FOUND", "Review not found.");
    }
    return res.json({ message: "Review deleted." });
  } catch (error) {
    return sendError(res, 500, "DELETE_REVIEW_FAILED", "Failed to delete review.");
  }
});

// Inventory routes 
// Validate incoming inventory payloads for POST / PUT operations.
const validateInventoryPayload = (data, requireAll = true) => {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Request body must be a JSON object." };
  }

  const errors = [];

  if (requireAll || data.dealer_id !== undefined) {
    const dealerId = Number(data.dealer_id);
    if (!Number.isInteger(dealerId) || dealerId <= 0) {
      errors.push("Field 'dealer_id' must be a valid id.");
    }
  }

  if (requireAll || data.make !== undefined) {
    if (typeof data.make !== "string" || data.make.trim() === "") {
      errors.push("Field 'make' is required and must be a non-empty string.");
    }
  }

  if (requireAll || data.model !== undefined) {
    if (typeof data.model !== "string" || data.model.trim() === "") {
      errors.push("Field 'model' is required and must be a non-empty string.");
    }
  }

  if (requireAll || data.bodyType !== undefined) {
    if (typeof data.bodyType !== "string" || data.bodyType.trim() === "") {
      errors.push("Field 'bodyType' is required and must be a non-empty string.");
    }
  }

  if (requireAll || data.year !== undefined) {
    const year = Number(data.year);
    if (!Number.isInteger(year) || year < 1886) {
      errors.push("Field 'year' must be an integer >= 1886.");
    }
  }

  if (requireAll || data.mileage !== undefined) {
    const mileage = Number(data.mileage);
    if (!Number.isFinite(mileage) || mileage < 0) {
      errors.push("Field 'mileage' must be a non-negative number.");
    }
  }

  if (requireAll || data.chassis_number !== undefined) {
    if (
      typeof data.chassis_number !== "string" ||
      data.chassis_number.trim() === ""
    ) {
      errors.push(
        "Field 'chassis_number' is required and must be a non-empty string.",
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, message: errors[0] };
  }

  return { valid: true };
};

// GET /fetchInventory/dealer/:id  — all vehicles for a specific dealership
app.get("/fetchInventory/dealer/:id", async (req, res) => {
  const dealerId = Number(req.params.id);
  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return sendError(res, 400, "INVALID_DEALER_ID", "Dealer id must be a positive integer.");
  }

  try {
    const vehicles = await Inventory.find({ dealer_id: dealerId });
    return res.json(vehicles.map(stripChassisFromVehicle));
  } catch (error) {
    return sendError(res, 500, "FETCH_INVENTORY_FAILED", "Failed to fetch inventory.");
  }
});

// POST /internal/verify-chassis — decrypt inventory and verify customer input
app.post("/internal/verify-chassis", requireInternalApiKey, async (req, res) => {
  const dealerId = Number(req.body?.dealer_id);
  const chassisNumber = req.body?.chassis_number;

  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return sendError(res, 400, "INVALID_DEALER_ID", "Dealer id must be a positive integer.");
  }

  if (typeof chassisNumber !== "string" || chassisNumber.trim() === "") {
    return sendError(
      res,
      400,
      "CHASSIS_REQUIRED",
      "Chassis number is required to verify purchase.",
    );
  }

  try {
    const result = await verifyChassis(chassisNumber, dealerId, Inventory);
    return res.json({ verified: result.verified === true });
  } catch (error) {
    return sendError(
      res,
      500,
      "CHASSIS_VERIFICATION_FAILED",
      "Failed to verify chassis number.",
    );
  }
});

// POST /addInventory  — add a new vehicle to a dealership's inventory
app.post("/addInventory", async (req, res) => {
  const validation = validateInventoryPayload(req.body, true);
  if (!validation.valid) {
    return sendError(res, 400, "INVALID_INVENTORY_PAYLOAD", validation.message);
  }

  const dealerExists = await Dealerships.exists({ id: Number(req.body.dealer_id) });
  if (!dealerExists) {
    return sendError(res, 404, "DEALERSHIP_NOT_FOUND", "Cannot add inventory for a dealership that does not exist.");
  }

  const dealerId = Number(req.body.dealer_id);

  try {
    const duplicate = await isDuplicateChassis(
      req.body.chassis_number,
      dealerId,
      Inventory,
    );
    if (duplicate) {
      return sendError(
        res,
        409,
        "DUPLICATE_CHASSIS",
        "A vehicle with this chassis number already exists for this dealership.",
      );
    }

    const encryptedChassis = encryptChassis(req.body.chassis_number);
    const vehicle = new Inventory({
      dealer_id: dealerId,
      make: req.body.make.trim(),
      model: req.body.model.trim(),
      bodyType: req.body.bodyType.trim(),
      year: Number(req.body.year),
      mileage: Number(req.body.mileage),
      chassis_number: encryptedChassis,
    });

    const saved = await vehicle.save();
    return res.status(201).json(stripChassisFromVehicle(saved));
  } catch (error) {
    return sendError(res, 500, "ADD_INVENTORY_FAILED", "Failed to add inventory item.");
  }
});

// PUT /updateInventory/:id  — update a vehicle by its MongoDB _id
app.put("/updateInventory/:id", async (req, res) => {
  const vehicleId = req.params.id;

  // Validate only the fields that are provided (partial update)
  const validation = validateInventoryPayload(req.body, false);
  if (!validation.valid) {
    return sendError(res, 400, "INVALID_INVENTORY_PAYLOAD", validation.message);
  }

  const ALLOWED = ["make", "model", "bodyType", "year", "mileage"];
  const updates = {};
  for (const field of ALLOWED) {
    if (req.body[field] !== undefined) {
      updates[field] = field === "year" || field === "mileage"
        ? Number(req.body[field])
        : String(req.body[field]).trim();
    }
  }

  if (req.body.chassis_number !== undefined) {
    if (
      typeof req.body.chassis_number !== "string" ||
      req.body.chassis_number.trim() === ""
    ) {
      return sendError(
        res,
        400,
        "INVALID_CHASSIS",
        "Field 'chassis_number' must be a non-empty string when provided.",
      );
    }
    updates.chassis_number = encryptChassis(req.body.chassis_number);
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "NO_UPDATE_FIELDS", "At least one updatable field must be provided.");
  }

  try {
    if (req.body.chassis_number !== undefined) {
      const existingVehicle = await Inventory.findById(vehicleId);
      if (!existingVehicle) {
        return sendError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
      }

      const duplicate = await isDuplicateChassis(
        req.body.chassis_number,
        existingVehicle.dealer_id,
        Inventory,
        vehicleId,
      );
      if (duplicate) {
        return sendError(
          res,
          409,
          "DUPLICATE_CHASSIS",
          "A vehicle with this chassis number already exists for this dealership.",
        );
      }
    }

    const updated = await Inventory.findByIdAndUpdate(
      vehicleId,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return sendError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    }
    return res.json(stripChassisFromVehicle(updated));
  } catch (error) {
    if (error.name === "CastError") {
      return sendError(res, 400, "INVALID_VEHICLE_ID", "Invalid vehicle id format.");
    }
    return sendError(res, 500, "UPDATE_INVENTORY_FAILED", "Failed to update inventory item.");
  }
});

// DELETE /deleteInventory/:id  — delete a vehicle by its MongoDB _id
app.delete("/deleteInventory/:id", async (req, res) => {
  const vehicleId = req.params.id;

  try {
    const deleted = await Inventory.findByIdAndDelete(vehicleId);
    if (!deleted) {
      return sendError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
    }
    return res.json({ message: "Vehicle deleted." });
  } catch (error) {
    if (error.name === "CastError") {
      return sendError(res, 400, "INVALID_VEHICLE_ID", "Invalid vehicle id format.");
    }
    return sendError(res, 500, "DELETE_INVENTORY_FAILED", "Failed to delete inventory item.");
  }
});

// ── End of inventory routes ──────────────────────────────────────────────────

// Explicit async startup wrapper for all bootstrap operations.
const startServer = async () => {
  try {
    // Structured startup logs to make bootstrap progress and failures clear.
    console.log("[bootstrap] Starting database API service...");
    console.log(
      `[bootstrap] Configuration loaded: PORT=${PORT}, DB_NAME=${DB_NAME}, SEED_ON_START=${SEED_ON_START}`,
    );
    // Deterministic startup order: connect DB -> optional seed -> start HTTP listener.
    await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);
    console.log(`Connected to MongoDB database: ${DB_NAME}`);
    validateEncryptionKey();
    console.log("[bootstrap] Chassis encryption key validated.");
    await ensureDatabaseIndexes();

    if (SEED_ON_START) {
      console.log("[bootstrap] Seeding enabled. Running seed process...");
      await seedDatabase();
      console.log("Database seed completed.");
    } else {
      console.log("[bootstrap] Seeding disabled. Skipping seed process.");
    }

    await syncReviewCounter();
    await syncDealershipCounter();

    httpServer = app.listen(PORT, () => {
      console.log(
        `[bootstrap] API service is ready at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("[bootstrap] Failed to bootstrap API service.");
    
    console.error(error);
    process.exit(1);
  }
};

startServer();
