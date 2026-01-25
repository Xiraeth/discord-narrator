const {
  writeMessageToFile,
  writeInteractionDataToFile,
  upsertUserOnMessageCreate,
} = require("./lib");
const Eris = require("eris");
require("dotenv").config();
const { connectToMongo, User } = require("./mongo");

connectToMongo();

const appId = process.env.APP_ID;
const guildId = process.env.SERVER_ID;

const Constants = Eris.Constants;

const commandsToDelete = [];
const guildCommandsToDelete = [];

const bot = new Eris(
  `Bot ${process.env.BOT_TOKEN}`,
  {
    intents: ["guilds", "guildMessages", "messageContent", "directMessages"],
  },
  { description: "She narrates my life", owner: "Monk", prefix: "/" }
);

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

  console.log("----- bot is ready -----");
});

bot.on("interactionCreate", async (interaction) => {
  writeInteractionDataToFile(interaction);

  if (interaction instanceof Eris.CommandInteraction) {
    switch (interaction.data.name) {
      case "echo":
        interaction.createMessage("echo");
        return;
      // guild commands
      case "delete_commands":
        if (guildCommandsToDelete.length) {
          guildCommandsToDelete.forEach(
            async (com) => await bot.deleteGuildCommand(guildId, com)
          );
          interaction.createMessage("commands deleted");
        } else {
          interaction.createMessage("Nothing to delete.");
        }
        return;
      // global commands
      case "delete_global_commands":
        if (commandsToDelete.length) {
          commandsToDelete.forEach(async (com) => await bot.deleteCommand(com));
          interaction.createMessage("commands deleted");
        } else {
          interaction.createMessage("Nothing to delete.");
        }
        return;
      // this points to the user who initiated the interaction
      // we want it to point to the user who sent the message
      case "Resend Message":
        interaction.createMessage(
          `@everyone, <@${interaction.member.user.id}> said: ${interaction.data.resolved.messages.get(interaction.data.target_id).content}`
        );
        return;
      case "create_dekete_command":
        bot.createGuildCommand(guildId, {
          name: "delete_command",
          description: "delete this command",
          type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
        });
        interaction.createMessage("command '/delete_command' created");
        return;
      default: {
        return interaction.createMessage(
          "interaction received - it wasn't very effective"
        );
      }
    }
  }
});

bot.on("messageCreate", async (msg) => {
  // this is the bot's response - don't save that anywhere
  if (msg.author.id !== appId) writeMessageToFile(msg);

  const { user, userGuild } = await upsertUserOnMessageCreate(msg);

  if (
    msg.content.toLowerCase().trim() === "@everyone" &&
    !user.bot &&
    msg.guildID
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
});

bot.on("messageDelete", (msg) => {
  writeMessageToFile(msg);

  bot.createMessage(
    msg.channel.id,
    "I saw that you deleted something. The message's ID has been saved."
  );
});

bot.on("error", (err) => {
  console.error(err);
});

bot.connect();
