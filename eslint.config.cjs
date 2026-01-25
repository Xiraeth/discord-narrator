const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  prettier, // Must be last to override other configs
]);
