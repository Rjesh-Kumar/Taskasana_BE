const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { initializeDatabase } = require("./db/db.connect");
const verifyToken = require("./middleware/authMiddleware");

const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project");
const taskRoutes = require("./routes/task");
const tagRoutes = require("./routes/tag");
const dashboardRoutes = require("./routes/dashboard");

dotenv.config();
initializeDatabase();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "You are authorized!", userId: req.user.id });
});

app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/tag", tagRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", require("./routes/report"));
app.use("/api/users", require("./routes/user"));

console.log("TEAM ROUTE MOUNTED");

app.get("/", (req, res) => res.send("API running..."));

const serverless = require("serverless-http");

if (process.env.NODE_ENV === "production") {
  module.exports = serverless(app);
} else {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}


