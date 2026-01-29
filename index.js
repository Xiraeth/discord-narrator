const Eris = require("eris");
const { connectToMongo } = require("./mongo");
const fs = require("fs");
const {
  writeMessageToFile,
  writeCommandInteractionDataToFile,
  getUserDataFromMessage,
  initializeBot,
} = require("./lib");
const { getRandomChampion } = require("./loldle");
const { createGuessCommands, exportCommands } = require("./commands.js");

require("dotenv").config();

connectToMongo();

const guildId = process.env.SERVER_ID;
const isInDevelopment = process.env.NODE_ENV === "development";

// const Constants = Eris.Constants;

const commandsToDelete = [];
const guildCommandsToDelete = [];

let champion;

const bot = new Eris.CommandClient(
  `Bot ${process.env.BOT_TOKEN}`,
  {
    intents: ["guilds", "guildMessages", "messageContent", "directMessages"],
  },
  {
    prefix: "!",
  }
);

bot.on("ready", async () => {
  // exportCommands(bot, guildId);
  initializeBot(bot);
});

bot.on("messageCreate", async (msg) => {
  // don't do anything if the message is from a bot
  if (msg.author.bot) return;
  // only write to file in development mode for debugging and logging purposes
  if (isInDevelopment) writeMessageToFile(msg);

  const { user, userGuild } = await getUserDataFromMessage(msg);

  if (userGuild) {
    userGuild.messagesTotal++;
    await user.save();
  }

  // warnings for when someone mentiosn everyone
  if (
    (msg.content.toLowerCase().trim().startsWith("@everyone") ||
      msg.content.toLowerCase().trim().startsWith("@here")) &&
    msg.guildID // only if the message is in a guild
  ) {
    try {
      let warnings = userGuild.warnings;
      const userString = `<@${msg.author.id}>`;

      userGuild.warnings += 1;
      await user.save();

      warnings++;

      if (warnings >= 5) {
        bot.createMessage(msg.channel.id, "You had been warned. Goodbye.");
        userGuild.warnings = 0;
        await user.save();
        return;
      }

      if (warnings === 1) {
        bot.createMessage(
          msg.channel.id,
          `Don't ping everyone, ${userString}. This is your first warning. At 5 you get kicked.`
        );
      } else {
        bot.createMessage(
          msg.channel.id,
          `Don't ping everyone, ${userString}. You have been warned ${warnings} times. At 5 you get kicked.`
        );
      }
      return;
    } catch (err) {
      console.error("error creating message", err);
    }
    return;
  }

  // echo command for connection testing
  if (msg.content.toLowerCase().trim() === "!echo") {
    try {
      bot.createMessage(msg.channel.id, "receiving");
    } catch (err) {
      console.error("error creating message", err);
    }
    return;
  }

  // details about myself
  if (msg.content.toLowerCase().trim() === "!author") {
    bot.createMessage(msg.channel.id, {
      messageReference: {
        messageID: msg.id,
      },
      content: "Links for the author's social media",
      components: [
        {
          type: Eris.Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              style: Eris.Constants.ButtonStyles.LINK,
              url: "https://nickiliadis.com",
              label: "Website",
              type: Eris.Constants.ComponentTypes.BUTTON,
            },
            {
              style: Eris.Constants.ButtonStyles.LINK,
              url: "https://github.com/Xiraeth",
              label: "Github",
              type: Eris.Constants.ComponentTypes.BUTTON,
            },
            {
              custom_id: "dismiss",
              style: Eris.Constants.ButtonStyles.SECONDARY,
              label: "Dismiss",
              type: Eris.Constants.ComponentTypes.BUTTON,
            },
          ],
        },
      ],
    });
  }
});

bot.on("interactionCreate", async (interaction) => {
  // command interactions (slash commands)
  if (interaction instanceof Eris.CommandInteraction) {
    if (isInDevelopment) writeCommandInteractionDataToFile(interaction);

    const interactionName = interaction.data.name;

    // deletes the commands for the guild
    if (interactionName === "delete_commands") {
      if (guildCommandsToDelete.length) {
        guildCommandsToDelete.forEach(
          async (com) => await bot.deleteGuildCommand(guildId, com)
        );
        interaction.createMessage("commands deleted");
      } else {
        interaction.createMessage(
          "Nothing to delete. Update the 'commandsToDelete' array to proceed."
        );
      }
      return;
    }
    // deletes the global app commands
    if (interactionName === "delete_global_commands") {
      if (commandsToDelete.length) {
        commandsToDelete.forEach(async (com) => await bot.deleteCommand(com));
        interaction.createMessage("commands deleted");
      } else {
        interaction.createMessage(
          "Nothing to delete. Update the 'commandsToDelete' array to proceed."
        );
      }
      return;
    }

    if (interactionName === "champion-guess") {
      champion = await getRandomChampion();

      await interaction.createMessage(
        "A champion has been rolled. You will be given clues to try to guess which one it is. Every two failed attempts, you will get another hint."
      );

      const rand = Math.floor(Math.random() * 4);
      const randomSpell = champion.spells[rand];

      interaction.createFollowup(
        `Today's champion has a spell called ${randomSpell}. Type '/guess [champion_name]' to start guessing.`
      );

      createGuessCommands(bot, guildId);
      return;
    }

    if (interactionName === "give_up") {
      interaction.createMessage(
        `You suck lol. The champion was ${champion.name}`
      );
    }

    // resends a message by mentioning everyone
    if (interactionName === "Resend Message") {
      const messageId = interaction.data.target_id;
      const resolvedMessage = interaction.data.resolved.messages.get(messageId);
      const { content, member, author } = resolvedMessage;

      let name;

      if (member && member.nick) {
        name = member.nick;
      } else if (author.bot) {
        name = author.username;
      } else {
        name = author.globalName;
      }

      return interaction.createMessage(
        `@everyone, ${name} said:\n> ${content}`
      );
    }

    if (interactionName === "give_up") {
      const cmdsToDelete = JSON.parse(
        fs.readFileSync("./commands.json")
      ).guildCommands.filter(
        (cmd) => cmd.name === "guess" || cmd.name === "give_up"
      );

      // todo: update commands in the json file
      cmdsToDelete.forEach((cmd) => {
        bot.deleteGuildCommand(guildId, cmd.id);
      });

      return;
    }

    return interaction.createMessage({
      content: "interaction received - there's no response for this command",
    });
  }

  // component interactions - select menus and buttons (so far only used for the dismiss button in the !author command)
  if (interaction instanceof Eris.ComponentInteraction) {
    try {
      const custom_id = interaction.data.custom_id;

      if (custom_id === "dismiss") {
        interaction.createMessage({
          content: "Message dismissed",
          flags: Eris.Constants.MessageFlags.EPHEMERAL,
        });
        bot.deleteMessage(
          interaction.message.channel.id,
          interaction.message.id
        );
        return;
      }
    } catch (err) {
      console.error("error creating message", err);
    }
  }
});

bot.on("error", (err) => {
  console.error(err);
});

bot.connect();
