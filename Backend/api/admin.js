const express = require("express");
const router = express.Router();
const db = require("../db");

// --- Admin Login ---
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const validPass24 = `anwarhusen@786`;
  const validEmail = "anwarkamalmomin329@gmail.com";
  
  if (password === validPass24 || email === validEmail) {
    return res.json({ message: "Login successful" });
  } else {
    return res.status(401).json({ message: "Invalid email or password" });
  }
});

// --- Fetch Dashboard Data ---
router.get("/data", (req, res) => {
  let result = {};

  // Users
  db.all(`SELECT id, name, email, createdAt FROM users`, [], (err, users) => {
    if (err) return res.status(500).json({ message: "DB Error fetching users" });
    result.users = users;

    // Orders (carts)
    db.all(
      `SELECT c.id, c.userId, u.name as userName, c.product, c.price, c.qty, c.date , c.status
       FROM carts c JOIN users u ON c.userId = u.id`,
      [],
      (err, orders) => {
        if (err) return res.status(500).json({ message: "DB Error fetching orders" });
        result.orders = orders;
        
        // Revenue (sum of price * qty)
        const revenue = orders.reduce((acc, o) => acc + o.price * o.qty, 0);
        result.revenue = revenue;

        res.json(result);
      }
    );
  });
});

module.exports = router;
