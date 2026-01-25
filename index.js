const Eris = require("eris");
const { connectToMongo } = require("./mongo");
const {
  writeMessageToFile,
  writeCommandInteractionDataToFile,
  getUserDataFromMessage,
  capitalizeFirstLetter,
} = require("./lib");

require("dotenv").config();

connectToMongo();

const guildId = process.env.SERVER_ID;
const isInDevelopment = process.env.NODE_ENV === "development";

const commandsToDelete = [];
const guildCommandsToDelete = [];

const bot = new Eris(`Bot ${process.env.BOT_TOKEN}`, {
  intents: ["guilds", "guildMessages", "messageContent", "directMessages"],
});

bot.on("ready", async () => {
  // const guildCommands = await bot.getCommands();
  // const botGuildCommands = await bot.getGuildCommands(guildId);

  // bot.createCommand({
  //   name: "name_of_the_command",
  //   type: Constants.ApplicationCommandTypes.USER,
  //   description: "description_of_the_command",
  // });

  // bot.createGuildCommand(guildId, {
  //   name: "Resend Message",
  //   type: Constants.ApplicationCommandTypes.MESSAGE,
  // });

  // bot.createGuildCommand(guildId, {
  //   name: "select_starter",
  //   description: "Select a starter Pokemon",
  //   type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
  //   options: [
  //     {
  //       name: "starter",
  //       description: "The type of the start",
  //       type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
  //       required: true,
  //       choices: [
  //         {
  //           name: "Bulbasaur",
  //           value: "bulbasaur",
  //         },
  //         {
  //           name: "Charmander",
  //           value: "charmander",
  //         },
  //         {
  //           name: "Squirtle",
  //           value: "squirtle",
  //         },
  //       ],
  //     },
  //     {
  //       name: "region",
  //       description: "The region of the starter",
  //       type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
  //       required: true,
  //       choices: [
  //         {
  //           name: "Kanto",
  //           value: "kanto",
  //         },
  //         {
  //           name: "Johto",
  //           value: "johto",
  //         },
  //       ],
  //     },
  //     {
  //       name: "shiny",
  //       description: "Is the starter shiny?",
  //       type: Eris.Constants.ApplicationCommandOptionTypes.BOOLEAN,
  //       required: true,
  //       choices: [
  //         { name: "Yes", value: true },
  //         { name: "No", value: false },
  //       ],
  //     },
  //   ],
  // });

  console.log("----- bot is ready -----");
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

  if (msg.content.toLowerCase().trim() === "!pong") {
    try {
      bot.createMessage(msg.channel.id, "Ping!");
    } catch (err) {
      console.error("error creating message", err);
    }
    return;
  }

  if (msg.content.toLowerCase().trim() === "!classes") {
    try {
      const response = await fetch(
        "https://xiraeth.github.io/dnd-json-test/classes.json",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const object = JSON.parse(JSON.stringify(data));
      const array = Object.keys(object);

      const message = array.join(", ");

      bot.createMessage(msg.channel.id, message);
    } catch (err) {
      console.error("error creating message", err);
    }
    return;
  }

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
  if (interaction instanceof Eris.CommandInteraction) {
    if (isInDevelopment) writeCommandInteractionDataToFile(interaction);

    const interactionName = interaction.data.name;

    if (interactionName === "select_starter") {
      const [starter, region, shiny] = interaction.data.options;

      interaction.createMessage(
        `Your starter of choice is ${capitalizeFirstLetter(starter.value)} and it is ${shiny.value ? "shiny" : "not shiny"}. You will start in ${capitalizeFirstLetter(region.value)}.`
      );
      return;
    } else if (interactionName === "echo") {
      interaction.createMessage("echo");
      return;
    } else if (interactionName === "delete_commands") {
      if (guildCommandsToDelete.length) {
        guildCommandsToDelete.forEach(
          async (com) => await bot.deleteGuildCommand(guildId, com)
        );
        interaction.createMessage("commands deleted");
      } else {
        interaction.createMessage("Nothing to delete.");
      }
      return;
    } else if (interactionName === "delete_global_commands") {
      if (commandsToDelete.length) {
        commandsToDelete.forEach(async (com) => await bot.deleteCommand(com));
        interaction.createMessage("commands deleted");
      } else {
        interaction.createMessage("Nothing to delete.");
      }
      return;
    } else if (interactionName === "Resend Message") {
      interaction.createMessage(
        `@everyone, <@${interaction.member.user.id}> said: ${interaction.data.resolved.messages.get(interaction.data.target_id).content}`
      );
      return;
    } else if (interactionName === "create_dekete_command") {
      bot.createGuildCommand(guildId, {
        name: "delete_command",
        description: "delete this command",
        type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
      });
      interaction.createMessage("command '/delete_command' created");
      return;
    } else {
      return interaction.createMessage({
        content: "interaction received - it wasn't very effective",
      });
    }
  }

  if (interaction instanceof Eris.ComponentInteraction) {
    try {
      const dismissMessage = interaction.data.custom_id === "dismiss";

      if (dismissMessage) {
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
