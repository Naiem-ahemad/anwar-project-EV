const express = require("express");
const cors = require("cors");
const authRoutes = require("./api/auth");
const cartRoutes = require("./api/cart");
const contactRoutes = require("./api/contact");
const jwt = require("jsonwebtoken");
const adminRoutes = require("./api/admin");
const path = require("path");

const app = express();

// Serve user profile images at /user/profile
app.use("/user/profile", express.static(path.join(__dirname, "user/profile")));

// --- MIDDLEWARE ---
app.use(cors({
  origin: ["http://127.0.0.1:5501", "http://localhost:5501"],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.options("*", (req, res) => {
  res.sendStatus(204);
});

app.use(express.json()); // <-- must be BEFORE routes
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET || "supersecretkey", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = {
      ...user,
      id: Number(user.id),
    };
    next();
  });
}

app.use("/api", authRoutes);
app.use("/api/cart" , cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.static("public"));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
