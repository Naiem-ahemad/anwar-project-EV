const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const router = express.Router();

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// Auth middleware
function auth(req, res, next) {
  if (req.method === "OPTIONS") return next(); // skip preflight

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = { id: Number(user.id) }; // Only id is required
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Get cart
router.get("/", auth, (req, res) => {
  db.all(`SELECT * FROM carts WHERE userId = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });

    console.log("Cart items found:", rows);

    res.json({ cart: rows });
  });
});

// Add item
router.post("/", auth, (req, res) => {
  const { product, price, date, qty } = req.body;
  db.run(
    `INSERT INTO carts (userId, product, price, date, qty, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, product, price, date, qty || 1, "pending"],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ message: "Added to cart", itemId: this.lastID });
    }
  );
});

//checkout
router.post("/checkout/:id", auth, (req, res) => {
  const orderId = req.params.id;
  const paidAt = new Date().toISOString();

  db.run(
    `UPDATE carts SET status = ?, paidAt = ? WHERE id = ? AND userId = ?`,
    ["paid", paidAt, orderId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error", error: err });

      if (this.changes === 0) {
        return res.status(404).json({ message: "Order not found or unauthorized" });
      }

      res.json({ message: "Checkout successful", orderId, paidAt });
    }
  );
});

// Remove item
router.delete("/:id", auth, (req, res) => {
  db.run(
    `DELETE FROM carts WHERE id = ? AND userId = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ message: "Removed" });
    }
  );
});

// Empty cart
router.delete("/", auth, (req, res) => {
  const userId = req.user.id;
  console.log("Trying to empty cart for userId:", userId);

  db.all(`SELECT * FROM carts WHERE userId = ?`, [userId], (err, rows) => {
    console.log("Cart items found:", rows);
    if (err) return res.status(500).json({ message: "DB error", error: err });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No items found in cart" });
    }

    db.run(`DELETE FROM carts WHERE userId = ?`, [userId], function (err) {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      console.log("Deleted items count:", this.changes);
      res.json({
        message: "Cart emptied successfully",
        deletedItems: this.changes,
      });
    });
  });
});

module.exports = router;
