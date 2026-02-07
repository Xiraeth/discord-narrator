const Eris = require("eris");
const fs = require("fs");
const Constants = Eris.Constants;

const createGuessCommands = async (bot, guildId) => {
  bot.createGuildCommand(guildId, {
    name: "guess",
    description: "Start typing to get Champion name suggestions",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
    options: [
      {
        autocomplete: true,
        name: "champion_name",
        description: "The name of the champion to guess",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
      },
    ],
  });

  bot.createGuildCommand(guildId, {
    name: "give_up",
    description: "Let the river take it",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  });
  console.log("created 'guess' and 'give up' commands");

  await exportCommands(bot, guildId);
};

const DISCORD_UNKNOWN_COMMAND = 10063;

const deleteGuessCommands = async (bot, guildId) => {
  if (!bot || !guildId) return;

  let guildCommands;
  try {
    guildCommands = await bot.getGuildCommands(guildId);
  } catch (err) {
    console.error("error fetching guild commands for delete", err);
    return;
  }

  const toDelete = guildCommands.filter(
    (cmd) => cmd.name === "guess" || cmd.name === "give_up"
  );

  if (!toDelete.length) {
    console.log("no guess/give_up commands to delete");
    await exportCommands(bot, guildId);
    return;
  }

  for (const cmd of toDelete) {
    try {
      await bot.deleteGuildCommand(guildId, cmd.id);
    } catch (err) {
      if (err.code === DISCORD_UNKNOWN_COMMAND) {
        continue;
      }
      console.error("error deleting command", cmd.name, err);
    }
  }
  console.log("deleted 'guess' and 'give up' commands");
  await exportCommands(bot, guildId);
};

const exportCommands = async (bot, guildId) => {
  if (!bot || !guildId) {
    console.error("Missing bot or guildId in 'exportCommands'");
    return;
  }

  console.log("exporting commands");
  const guildCommands = await bot.getGuildCommands(guildId);
  const globalCommands = await bot.getCommands();

  const commands = {
    guildCommands,
    globalCommands,
  };

  fs.writeFileSync("./commands.json", JSON.stringify(commands, null, 2));
  console.log("commands.json file updated");
};

module.exports = {
  createGuessCommands,
  exportCommands,
  deleteGuessCommands,
};
