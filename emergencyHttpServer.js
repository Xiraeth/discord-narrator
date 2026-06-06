const express = require("express");

const startEmergencyHttpServer = ({ bot, isBotReady }) => {
  const app = express();
  const httpPort = Number(process.env.HTTP_PORT) || 3000;
  const emergencyUserId = process.env.EMERGENCY_USER_ID;
  const emergencyMessage =
    process.env.EMERGENCY_MESSAGE || "Emergency button was pressed.";

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ ok: true, discordReady: isBotReady() });
  });

  app.post("/emergency", async (req, res) => {
    if (!isBotReady()) {
      return res
        .status(503)
        .json({ ok: false, error: "Discord bot is not ready" });
    }

    if (!emergencyUserId) {
      return res
        .status(500)
        .json({ ok: false, error: "EMERGENCY_USER_ID is not configured" });
    }

    try {
      const dmChannel = await bot.getDMChannel(emergencyUserId);
      await bot.createMessage(dmChannel.id, emergencyMessage);
      console.log("Emergency request received:", {
        body: req.body,
        ip: req.ip,
        receivedAt: new Date().toISOString(),
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error("error sending emergency message", err);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to send message" });
    }
  });

  const server = app.listen(httpPort, "0.0.0.0", () => {
    console.log(
      `Emergency HTTP server listening on http://0.0.0.0:${httpPort}`
    );
  });

  server.on("error", (err) => {
    console.error("Emergency HTTP server failed to start", err);
  });
};

module.exports = { startEmergencyHttpServer };
