require('dotenv').config();

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OWNER_ID: process.env.OWNER_ID
};

if (!config.BOT_TOKEN) {
  console.error("FATAL: BOT_TOKEN is missing in .env");
  process.exit(1);
}

if (!config.OWNER_ID) {
  console.error("FATAL: OWNER_ID is missing in .env");
  process.exit(1);
}

module.exports = config;
