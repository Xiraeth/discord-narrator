const fs = require("fs");
const Eris = require("eris");
const { User } = require("./mongoSchemas");

const writeMessageToFile = (msg) => {
  const time = new Date(msg?.timestamp);
  const greeceTime = time.toLocaleTimeString("en-US", {
    timeZone: "Europe/Athens",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  fs.writeFileSync("message.json", JSON.stringify(msg, null, 2));
  console.log("message written to file 'message.json'");
  console.log({ timestamp: greeceTime });
};

const writeCommandInteractionDataToFile = (interaction) => {
  const time = new Date(interaction?.createdAt ?? new Date());
  const greeceTime = time.toLocaleTimeString("en-US", {
    timeZone: "Europe/Athens",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // map the interaction type to its name and write both to the file - this is easier for me until i get used to the types and their mappings
  const erisInteractionTypeObject = Object.entries(
    Eris.Constants.InteractionTypes
  ).find(([key]) => Eris.Constants.InteractionTypes[key] === interaction.type);

  const interactionTypeString = `${erisInteractionTypeObject[1]}: ${erisInteractionTypeObject[0]}`;

  // do the same with the interaction.data (application command type):
  const erisApplicationCommandTypeObject = Object.entries(
    Eris.Constants.ApplicationCommandTypes
  ).find(
    ([key]) =>
      Eris.Constants.ApplicationCommandTypes[key] === interaction.data.type
  );

  const applicationCommandTypeString = `${erisApplicationCommandTypeObject[1]}: ${erisApplicationCommandTypeObject[0]}`;

  const objectToLog = {
    type: interactionTypeString,
    data: {
      ...interaction.data,
      type: applicationCommandTypeString,
    },
    user: interaction.member.user,
  };

  fs.writeFileSync("interaction.json", JSON.stringify(objectToLog, null, 2));
  console.log("interaction written to file 'interaction.json'");
  console.log({ timestamp: greeceTime });
};

const getUserDataFromMessage = async (msg) => {
  let user = await User.findOne({ userId: msg.author.id });

  if (!user) {
    user = await User.create({
      userId: msg.author.id,
      username: msg.author.username,
      globalName: msg.author.globalName,
      avatar: msg.author.avatar,
      bot: msg.author.bot,
      createdAt: new Date().getTime(),
      guilds: [],
    });
  }

  const msgGuildId = msg.guildID;
  const userGuilds = user.guilds;
  let userGuild = userGuilds?.find((guild) => guild.guildId === msgGuildId);

  if (!msgGuildId) {
    console.log("Message was not sent in a guild - skipping");
  } else if (userGuild) {
    console.log("Guild is already registered on user - skipping");
  } else {
    const newGuildForUser = {
      guildId: msgGuildId,
      nickname: msg.member.nick,
      joinedAt: msg.member.joinedAt,
      roles: msg.member.roles,
      botInteractions: 0,
      messagesTotal: 0,
      warnings: 0,
    };

    user.guilds =
      userGuilds && userGuilds.length
        ? [...userGuilds, newGuildForUser]
        : [newGuildForUser];
    userGuild = newGuildForUser;
    await user.save();
  }

  return { user, userGuild };
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

module.exports = {
  writeMessageToFile,
  writeCommandInteractionDataToFile,
  capitalizeFirstLetter,
  getUserDataFromMessage,
};
