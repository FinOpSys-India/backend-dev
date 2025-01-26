require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async (req, res) => {
  const { to, subject, message } = req.body;
  console.log(message)
  let transporter = nodemailer.createTransport({
    services: "hostinger",
    host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: false, // 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  let mailOptions = {
    from:process.env.EMAIL_USER,
    to:to,
    subject: subject,
    text: message,
  };

 
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendEmail };
