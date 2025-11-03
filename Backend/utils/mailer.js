// utils/mailer.js
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
  console.warn("Warning: ZOHO_EMAIL or ZOHO_PASSWORD is missing in .env");
}

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

async function sendWelcomeEmail(toEmail, name) {
  const htmlPath = path.join(__dirname, "../emails/welcome.html");
  if (!fs.existsSync(htmlPath)) throw new Error("welcome.html not found");

  let userHtml = fs.readFileSync(htmlPath, "utf-8"); // <-- fixed
  userHtml = userHtml.replace(/{{name}}/g, name);

  return transporter.sendMail({
    from: process.env.ZOHO_EMAIL,
    to: toEmail,
    subject: "Welcome to GridCycle!",
    html: userHtml,
  });
}

async function sendContactEmail({ name, email, subject, message }) {
  const userTemplatePath = path.join(__dirname, "../emails/Contact_us.html");
  if (!fs.existsSync(userTemplatePath))
    throw new Error("Contact_us.html not found");
  let userHtml = fs.readFileSync(userTemplatePath, "utf-8");
  userHtml = userHtml.replace(/{{name}}/g, name);

  await transporter.sendMail({
    from: process.env.ZOHO_EMAIL,
    to: email,
    subject: "Thank you for contacting GridCycle",
    html: userHtml,
  });
  const admin_html = path.join(__dirname, "../emails/admin_contact_us.html");

  if (!fs.existsSync(admin_html)) {
    console.error("Error: admin_contact_us.html not found at", admin_html);
    return;
  }

  let adminhtm;
  try {
    adminhtm = fs.readFileSync(admin_html, "utf-8");
  } catch (err) {
    console.error("Error reading admin_contact_us.html:", err);
    return;
  }

  adminhtm = adminhtm.replace(/{{name}}/g, name);
  adminhtm = adminhtm.replace(/{{useremail}}/g, email);
  adminhtm = adminhtm.replace(/{{query}}/g, subject);
  adminhtm = adminhtm.replace(/{{response}}/g, message);

  try {
    const info = await transporter.sendMail({
      from: process.env.ZOHO_EMAIL,
      to: "anwarkamalmomin329@gmail.com",
      subject: `New Contact : ${subject}`,
      html: adminhtm,
    });
    console.log("Admin email sent successfully:", info.messageId);
  } catch (err) {
    console.error("Failed to send admin email:", err);
  }
}

module.exports = { sendWelcomeEmail, sendContactEmail };
