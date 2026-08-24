require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.MONGO_URL;

// Coordinates: [longitude, latitude]
const coordinates = {
  Malibu: [-118.2437, 34.0259],
  "New York City": [-74.006, 40.7128],
  Aspen: [-106.8175, 39.1911],
  Florence: [11.2558, 43.7696],
  Portland: [-122.6784, 45.5152],
  Cancun: [-86.8515, 21.1619],
  "Lake Tahoe": [-120.0324, 39.0968],
  "Los Angeles": [-118.2437, 34.0522],
  Verbier: [7.2281, 46.0964],
  "Serengeti National Park": [34.8333, -2.3333],
  Amsterdam: [4.9041, 52.3676],
  Fiji: [179.4144, -17.7134],
  Cotswolds: [-1.8433, 51.833],
  Boston: [-71.0589, 42.3601],
  Bali: [115.1889, -8.4095],
  Banff: [-115.5708, 51.1784],
  Miami: [-80.1918, 25.7617],
  Phuket: [98.3381, 7.8804],
  "Scottish Highlands": [-4.2026, 57.1207],
  Dubai: [55.2708, 25.2048],
  Montana: [-110.3626, 46.8797],
  Mykonos: [25.3289, 37.4467],
  "Costa Rica": [-84.0907, 9.7489],
  Charleston: [-79.9311, 32.7765],
  Tokyo: [139.6917, 35.6895],
  "New Hampshire": [-71.5724, 43.1939],
  Maldives: [73.2207, 3.2028],
};

async function main() {
  await mongoose.connect(MONGO_URL);

  console.log("connected to db");

  await Listing.deleteMany({});
  console.log("old listings deleted");

  const listingsWithGeometry = initData.data.map((listing) => ({
    ...listing,
    geometry: {
      type: "Point",
      coordinates: coordinates[listing.location] || [0, 0],
    },
  }));

  await Listing.insertMany(listingsWithGeometry);

  console.log(`${listingsWithGeometry.length} listings were initialized`);

  await mongoose.connection.close();

  console.log("connection closed");
}

main().catch((err) => {
  console.log("MongoDB connection error:");
  console.log(err);
});