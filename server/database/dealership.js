/* jshint esversion: 11, node: true, sub: true */
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dealerships = new Schema({
  dealer_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  tin: {
    type: String,
    required: true,
    unique: true,
  },
  district: {
    type: String,
    required: true,
  },
  physical_address: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("dealerships", dealerships);
