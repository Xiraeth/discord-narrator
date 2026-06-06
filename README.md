# Discord Narrator

A personal Discord bot built with [Eris](https://abal.moe/Eris/) and MongoDB. It tracks basic server/user activity, responds to a few message commands, manages a League of Legends champion guessing game, and can expose a development-only HTTP endpoint for an ESP32 emergency button.

## Features

- Connects to Discord through an Eris `CommandClient`
- Stores users and guild metadata in MongoDB
- Tracks per-user message counts per guild
- Warns users who ping `@everyone` or `@here`
- Supports simple prefix commands:
  - `!echo`
  - `!author`
  - `!user`
- Supports slash/context commands:
  - `/champion-guess`
  - `/guess`
  - `/give_up`
  - `Resend Message` message context command
- Exports Discord command data to `commands.json`
- In development mode, writes debug payloads to `message.json` and `interaction.json`
- In development mode, starts an emergency HTTP listener for local ESP32 requests

## Requirements

- Node.js
- npm
- MongoDB
- A Discord bot application and token
- A Discord server/guild where the bot is installed

The bot must be configured with the Discord intents it uses:

- Guilds
- Guild Messages
- Message Content
- Direct Messages
- Voice States / Guild Voice States

## Setup

Install dependencies:

```bash
npm install
```

## Running

Start normally:

```bash
npm start
```

Start with nodemon:

```bash
npm run dev
```

When the bot starts successfully, it connects to MongoDB, connects to Discord, removes stale temporary guess commands, and registers guild data if needed.

## Emergency HTTP Listener

The emergency HTTP server only runs when:

```env
NODE_ENV=development
```

It listens on:

```text
http://0.0.0.0:3000
```

or the port set by `HTTP_PORT`.

Health check:

```bash
curl http://localhost:3000/health
```

Emergency request:

```bash
curl -X POST http://localhost:3000/emergency \
  -H "Content-Type: application/json" \
  -d '{"event":"button_pressed"}'
```

If the bot is connected and `EMERGENCY_USER_ID` is set, the bot opens a DM channel with that user and sends `EMERGENCY_MESSAGE`.

This endpoint is intended for local LAN development with the ESP32 emergency button, not to be used publicly.

## Project Structure

```text
.
├── index.js                 # Discord bot entrypoint
├── emergencyHttpServer.js   # Development-only ESP32 emergency HTTP endpoint
├── commands.js              # Discord command create/delete/export helpers
├── lib.js                   # Message logging, user/guild helpers, formatting
├── loldle.js                # Champion guessing game helpers
├── mongo.js                 # MongoDB connection and user lookup
├── mongoSchemas.js          # Mongoose schemas
├── championFull.json        # Champion data source
├── .env.example             # Environment variable template
└── package.json
```
