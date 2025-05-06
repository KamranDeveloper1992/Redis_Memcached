const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const redis = require("redis");

const app = express();
const PORT = 5000;

const uri =
  "mongodb+srv://kamranD:mQZetgXJk4jIaij7@cluster0.udbpvg9.mongodb.net/UserRegister?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const redisClient = redis.createClient();
(async () => {
  await redisClient.connect();
  console.log("Redis bağlıdır!");
})();

app.get("/users", async (req, res) => {
  const cacheKey = "users";

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({ source: "cache", data: JSON.parse(cachedData) });
    }

    await client.connect();
    const database = client.db("UserRegister");
    const usersCollection = database.collection("users");
    const users = await usersCollection.find().toArray();

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(users));

    res.json({ source: "database", data: users });
  } catch (error) {
    res.status(500).json({ error: "Xəta baş verdi", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server ${PORT} portunda işləyir`));

process.on("SIGINT", async () => {
  await redisClient.quit();
  await client.close();
  process.exit();
});
