require("dotenv").config();
const nodemailer = require("nodemailer");
const { createUser } = require("../models/model");

const SendInvite = async (req, res) => {
  const mailId = req.body;
  console.log(mailId)


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
    to: mailId.join(","), 
    subject: "send the invite",
    text: "message",
  };

 
  try {
    await transporter.sendMail(mailOptions);
    for (let i = 0; i < mailId.length; i++) {
      let data = {
        workEmail: mailId[i],
        firstName:null,
        lastName: null,
        companyName: null, 
        companyType: null, 
        phoneNumber: null,
        department: null,
        position: null,
        password: "pratibha@1",
      };

      // Create user for each email
      await new Promise((resolve, reject) => {
        createUser(data, (err, result) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          resolve(result);
        });
      });
    }
    res.json({ success: true, message: "invite sent successfully!" });
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { SendInvite };

