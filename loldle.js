const fs = require("fs");

const sanitizeString = (string) => {
  return string.replaceAll("<br>", " ");
};

const randomValue = () => {
  return Math.floor(Math.random() * 172);
};

const getRandomChampion = async () => {
  const response = fs.readFileSync("championFull.json", "utf8");
  const championsData = JSON.parse(response).data;

  const rand = randomValue();
  const randomChampion = championsData[Object.keys(championsData)[rand]];

  const { name, passive, title, partype: resource, tags } = randomChampion;

  const filteredPassiveDescription = passive.description.replaceAll(
    name,
    "____"
  );
  const filteredPassiveName = passive.name.replace(name, "____");

  const spells = randomChampion.spells.map((spell) => spell.name);

  const todaysChampion = {
    name: sanitizeString(name),
    passive: {
      ...passive,
      name: sanitizeString(filteredPassiveName),
      description: sanitizeString(filteredPassiveDescription),
    },
    title: sanitizeString(title),
    resource,
    tags: tags.map(sanitizeString),
    spells,
  };

  return todaysChampion;
};

const getChampionChoices = () => {
  const response = fs.readFileSync("championFull.json", "utf8");
  const championsData = JSON.parse(response).data;

  return Object.keys(championsData).map((name) => ({
    value: name.toLowerCase(),
    name,
  }));
};

module.exports = {
  getRandomChampion,
  getChampionChoices,
};
