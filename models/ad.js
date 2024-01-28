
import mongoose from "mongoose";
const { Schema, ObjectId } = mongoose;
import { model } from "mongoose";

const adSchema = new Schema({
  photos: [{}],
  price: {
    type: Number,
    maxLength: 255
  },
  bedrooms: Number,
  bathrooms: Number,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [22.719568, 75.857727]
    }
  },
  title: {
    type: String,
    maxLength: 255
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
  },
  description: {},
  postedBy: {
    type: ObjectId,
    ref: "User"
  },
  // sold
  rented: {
    type: Boolean,
    default: false
  },
  // room or flat
  type: {
    type: String,
    default: "Room"
  },
  views: {
    type: Number,
    default: 0
  },
  laundry: {
    type: Boolean
  },
  ROwater: {
    type: Boolean
  },
  wifi: {
    type: Boolean
  },
  // label-address
  label: {
    type: String
  },
  street: {
    type: String
  },
  // area
  district: {
    type: String
  },
  city: {
    type: String
  },
  country: {
    type: String
  },
  completeMap: {},
  openCageMap: {}

}, {
  timestamps: true
});

export default model("Ad", adSchema);