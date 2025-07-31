// config/redisClient.js
const { createClient } = require("redis");

let client;

const getRedisClient = async () => {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on("error", (err) => {
      console.error("❌ Redis Error", err);
    });

    await client.connect();
    console.log("✅ Redis connected");
  }

  return client;
};

module.exports = { getRedisClient };
