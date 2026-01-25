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

const UserGuildSchema = new mongoose.Schema({
  guildId: String,
  nickname: String,
  roles: [String],
  warnings: Number,
  messagesTotal: Number,
  botInteractions: Number,
  joinedAt: Number, // timestamp
});

const MessageSchema = new mongoose.Schema({
  userId: String,
  messageId: String,
  channelId: String,
  guildId: String,
  timestamp: Date,
});

const UserSchema = new mongoose.Schema({
  userId: String,
  username: String,
  globalName: String,
  avatar: String,
  bot: Boolean,
  createdAt: Number, // timestamp
  guilds: [UserGuildSchema],
});

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

module.exports = { connectToMongo, Message, User };
