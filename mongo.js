const mongoose = require("mongoose");
const { User } = require("./mongoSchemas");
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

const getUser = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user) {
    return { user: null, error: `User not found` };
  }
  return { user, error: null };
};

module.exports = { connectToMongo, getUser };
