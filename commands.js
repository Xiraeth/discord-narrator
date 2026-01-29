const Eris = require("eris");
const fs = require("fs");
const { getChampionChoices } = require("./loldle");
const Constants = Eris.Constants;

const createGuessCommands = (bot, guildId) => {
  const choices = getChampionChoices();
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
        choices: choices.slice(0, 20),
      },
    ],
  });

  bot.createGuildCommand(guildId, {
    name: "give_up",
    description: "Let the river take it",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  });
  console.log("created 'guess' and 'give up' commands");

  exportCommands(bot, guildId);
};

const exportCommands = async (bot, guildId) => {
  if (!bot || !guildId) {
    console.error("Missing bot or guildId in 'exportCommands'");
    return;
  }

  const guildCommands = await bot.getGuildCommands(guildId);
  const globalCommands = await bot.getCommands();

  const commands = {
    guildCommands,
    globalCommands,
  };

  fs.writeFileSync("commands.json", JSON.stringify(commands, null, 2));
  console.log("commands updated");
};

module.exports = {
  createGuessCommands,
  exportCommands,
};
