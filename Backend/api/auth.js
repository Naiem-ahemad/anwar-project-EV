const express = require("express");
const router = express.Router();
const { sendWelcomeEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");
const db = require("../db");
const axios = require("axios");
const querystring = require("querystring");
const fs = require("fs");
const path = require("path");

function sendPopupMessage(res, data) {
  res.send(`
    <html>
      <body>
        <script>
          window.opener.postMessage(${JSON.stringify(data)}, "*");
          window.close();
        </script>
      </body>
    </html>
  `);
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (row) return res.status(400).json({ message: "Email already exists" });
    
    try {
      await sendWelcomeEmail(email, name);

      const createdAt = new Date().toISOString();
      db.run(
        `INSERT INTO users (name, email, password, createdAt) VALUES (?, ?, ?, ?)`,
        [name, email, password, createdAt],
        function (err) {
          if (err) return res.status(500).json({ message: "DB insert failed" });

          const user = { id: this.lastID, name, email };
          const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );
          
          res.json({ user, token });
        }
      );
    } catch (err) {
      console.log("Error sending email:", err);
      res.status(400).json({ message: "Invalid email or SMTP failed" });
    }
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (!row)
        return res.status(401).json({ message: "Invalid email or password" });

      const user = { id: row.id, name: row.name, email: row.email };
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({ user, token });
    }
  );
});

router.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code provided");

  try {
    const tokenResp = await axios.post(
      "https://oauth2.googleapis.com/token",
      querystring.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/api/oauth/callback",
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { id_token } = tokenResp.data;

    const userInfo = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );
    const { email, name, picture, sub } = userInfo.data; // sub is unique Google ID
    console.log("Google user info:", userInfo.data);

    const profileDir = path.join(__dirname, "..", "user/profile");
    if (!fs.existsSync(profileDir))
      fs.mkdirSync(profileDir, { recursive: true });

    let row = await getUserByEmail(email);
    let userId;
    let photoPath = `https://api.anwarhusen.dpdns.org/user/profile/default.png`;

    // Helper: download picture only if not exists
    const downloadProfilePicture = async (url, sub) => {
      if (!url) return photoPath;
      const fileName = `user_${sub}.png`;
      const filePath = path.join(profileDir, fileName);

      if (fs.existsSync(filePath))
        return `https://api.anwarhusen.dpdns.org/user/profile/${fileName}`; // already downloaded

      try {
        const picUrl = url.split("=")[0]; // remove =s96-c
        const imgResp = await axios.get(picUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (imgResp.status === 200) {
          fs.writeFileSync(filePath, imgResp.data);
          console.log("Profile picture saved:", fileName);
          return `https://api.anwarhusen.dpdns.org/user/profile/${fileName}`;
        }
      } catch (err) {
        console.error("Profile picture download failed:", err.message);
      }
      return photoPath;
    };

    if (!row) {
      await sendWelcomeEmail(email, name);
      photoPath = await downloadProfilePicture(picture, sub);
      const createdAt = new Date().toISOString();

      db.run(
        `INSERT INTO users (name,email,password,photo,createdAt) VALUES (?,?,?,?,?)`,
        [name, email, "GOOGLE_LOGIN", photoPath, createdAt],
        function (err) {
          if (err) return res.send("DB insert error");
          userId = this.lastID;
          const token = jwt.sign(
            { id: userId, email, name },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );
          sendPopupMessage(res, {
            user: { id: userId, name, email, photo: photoPath },
            token,
          });
        }
      );
    } else {
      userId = row.id;
      if (!row.photo || row.photo.includes("default.png")) {
        photoPath = await downloadProfilePicture(picture, sub);
        db.run(
          `UPDATE users SET photo = ? WHERE id = ?`,
          [photoPath, userId],
          (err) => {
            if (err) console.error("Failed to update user photo:", err.message);
          }
        );
      } else {
        photoPath = row.photo;
      }

      const token = jwt.sign(
        { id: userId, email, name: row.name },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      sendPopupMessage(res, {
        user: { id: userId, name: row.name, email, photo: photoPath },
        token,
      });
    }
  } catch (err) {
    console.error(err.response?.data || err);
    res.send("Google OAuth failed");
  }
});

module.exports = router;
