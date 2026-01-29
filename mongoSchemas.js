const mongoose = require("mongoose");

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

const GuildSchema = new mongoose.Schema({
  guildId: String,
  ownerId: String,
  membersCount: Number,
  banner: String,
  roles: [String], // the role ids
  members: [String], // the user ids
  channels: [String], // the channel ids
  joinedAt: Number, // timestamp
});

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);
const Guild = mongoose.model("Guild", GuildSchema);

module.exports = { Message, User, Guild };
