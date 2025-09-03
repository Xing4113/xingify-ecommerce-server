// config/redisClient.js
const { createClient } = require("redis");

let client;

const getRedisClient = async () => {
  if (!process.env.REDIS_URL) {
    console.warn("No REDIS_URL provided — skipping Redis connection.");
    return {
      get: async () => null,
      set: async () => null,
      del: async () => null,
      // Add other stubbed Redis methods as needed
    };
  }

  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });

    client.on("error", (err) => {
      console.error("❌ Redis Error", err);
    });

    await client.connect();
    console.log("✅ Redis connected");
  }

  return client;
};

module.exports = { getRedisClient };
