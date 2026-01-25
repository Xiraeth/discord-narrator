const mongoose = require("mongoose");
require("dotenv").config();

const connectToMongo = () =>
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("\n------Connected to MongoDB database------\n");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB database", err);
    });

module.exports = { connectToMongo };
