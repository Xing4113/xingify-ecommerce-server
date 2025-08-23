const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");

dotenv.config();
require("./models");
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const emailSubscriptionRoutes = require("./routes/emailSubscriptionRoutes");
const sequelize = require("./config/db");
const { getRedisClient } = require("./config/redisClient");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://zingy-cobbler-bfe33f.netlify.app",
      `http://192.168.0.180:3000`,
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/user", userRoutes);
app.use("/order", orderRoutes);
app.use("/stripe", stripeRoutes);
app.use("/email", emailSubscriptionRoutes);

const waitForDb = async (retries = 5, delay = 5000) => {
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("✅ Connected to MySQL via Sequelize");
      return;
    } catch (err) {
      console.warn(
        `⏳ DB not ready yet. Retrying in ${delay / 1000}s... (${retries} left)`
      );
      retries--;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Could not connect to MySQL after multiple attempts.");
};

// DB & Redis
const startServer = async () => {
  try {
    await waitForDb();

    // This use to snyc model files to database table.
    // sequelize
    //   .sync({ alter: true })
    //   .then(() => console.log("DB synced"))
    //   .catch((err) => console.error("DB sync failed", err));

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
  }
};

startServer();
