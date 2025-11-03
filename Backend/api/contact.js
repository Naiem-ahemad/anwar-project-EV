const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../utils/mailer");

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message)
    return res.status(400).json({ message: "All fields are required" });

  try {
    await sendContactEmail({ name, email, subject, message });
    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
