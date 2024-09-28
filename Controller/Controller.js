// controller.js

const bcrypt = require("bcrypt");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {
  createUser,
  findUserByEmail,
  findUserByPhone,
  updatePasswordInDatabase,
  createMemberOfCompany,
  findCompanyMemberByEmail,
  findCompanyMemberByPhone,
  updateMemberPasswordInDatabase,
  createAcessControl,
  getAccessControl,
  fetchAllCompanyMembers,
  getLoginPersonDetails,
} = require("../models/model");
const { message } = require("antd");

const saltRounds = 10;
const saltRoundsMember = 10;
const loginName = "";
const jwtSecretKey = "jwt-secret-key";

const cooCookie = require("js-cookie");

// Temporary storage for OTPs (for demo purposes, use a secure storage in production)
let otpStorage = {};
let otpStorageMember = {};

function signup(req, res) {
  createUser(req.body, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }
    res.json({ Status: result });
  });
}

// ---------------------------------------------------login-----------------------------------

function  login(req, res) {
  const { phoneNumber, otp } = req.body;
  // Retrieve OTP from storage
  const storedOtp = otpStorage[phoneNumber];
  if (storedOtp === otp) {
    // OTP matched, clear OTP from storage (for security)
    delete otpStorage[phoneNumber];

    findUserByPhone(req.body.phoneNumber, (err, rows) => {
      // -------------------------jwt--------------------------
      const token = jwt.sign({ firstName: rows[0].FIRSTNAME }, jwtSecretKey, {
        expiresIn: "30d",
      });
      // res.cookie("token", token, { httpOnly: true });
      return res.json({ Status: "OTP verified successfully" ,token});
    });
  } else {
    res.status(400).send("Invalid OTP");
  }
}

// ----------------------------logout--------------------------------

function logout(req, res) {
  return res.json({ Status: "Successful" });
}

// ----------------------------otp---------------------------
function getOtp(req, res) {
  findUserByEmail(req.body.workEmail, (err, rows) => {
    if (err) {
      return res.json({ Error: err });
    }

    if (rows.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        rows[0].PASSWORD,
        (err, response) => {
          if (err) {
            return res.json({ Error: "Error in comparing password" });
          }
          if (response) {
            let phoneNumber = rows[0].PHONENUMBER;

            //    Twilio credentials
            const accountSid = process.env.ACCOUNTSID;
            const authToken = process.env.AUTHTOKEN;
            const client = new twilio(accountSid, authToken);

            // Generate a random 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStorage[rows[0].PHONENUMBER] = otp;

            client.messages
              .create({
                body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                from: process.env.TWILIOPHONENUMBER,
                to: phoneNumber,
              })
              .then((message) => {
                res
                  .status(200)
                  .send({
                    message: "OTP sent successfully!",
                    phoneNumber: rows[0].PHONENUMBER,
                  });
              })
              .catch((error) => {
                res.status(500).send({ message: "Failed to send OTP", error });
                console.log(error);
              });
          } else {
            return res.json({ Error: "Password not matched !" });
          }
        }
      );
    } else {
      return res.json({ Error: "No email exists" });
    }
  });
}

// ----------------------------OtpSendAgain------------------------
function OtpSendAgain(req, res) {
  // 1- ----- i have to  fimd the requeat data --------

  // const phoneNumber = req.body;

  findUserByPhone(req.body.phoneNumber, (err, rows) => {
    let phoneNumber = rows[0].PHONENUMBER;

    //    Twilio credentials
    const accountSid = process.env.ACCOUNTSID;
    const authToken = process.env.AUTHTOKEN;
    const client = new twilio(accountSid, authToken);

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[rows[0].PHONENUMBER] = otp;

    client.messages
      .create({
        body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
        from: process.env.TWILIOPHONENUMBER,
        to: phoneNumber,
      })
      .then((message) => {
        res
          .status(200)
          .send({
            message: "OTP sent successfully!",
            phoneNumber: rows[0].PHONENUMBER,
          });
      })
      .catch((error) => {
        res.status(500).send({ message: "Failed to send OTP", error });
        console.log(error);
      });
  });
}

// ----------------------------------------resetPasword-------------------------------------------

function resetPassword(req, res) {
  findUserByEmail(req.body.workEmail, (err, rows) => {
    if (err) {
      return res.json({ Error: err });
    }

    if (rows.length > 0) {
      bcrypt.compare(req.body.workEmail, rows[0].WORKEMAIL, (err, response) => {
        const { workEmail, password } = req.body;

        const newPassword = req.body.password; // You need a function to generate a new password
        // Update the password in the database
        updatePasswordInDatabase(workEmail, newPassword, (err, result) => {
          if (err) {
            return res.json({ Error: err });
          }
        res.status(200).send({ message: "Password updated successfully" });
        });
      });
    } else {
      return res.json({ Error: "No email exists" });
    }
  });

}

// ---------------------------temp access control -----------------------

function updateNotification(req, res) {
  const isCheckedNotification = req.body;

  createAcessControl(isCheckedNotification, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }
    res.json({ Status: result });
  });
}

function LoginPersonDetails(req, res) {
  const workEmail = req.query.workEmail;
  console.log(workEmail)
  getLoginPersonDetails(workEmail, (err, result) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result[0]);
  });
}

function getNotification(req, res) {
  getAccessControl(req, (err, result) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    res.json(result); // Directly send the result
  });
}

// ------------------------------------------------------------------------------Member section-------------------------------------------------------------------------

function memberSignup(req, res) {
  createMemberOfCompany(req.body, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }
    res.json({ Status: result });
  });
}

// -------------------login-----------------------------

function memberLogin(req, res) {
  const { phoneNumber, otp } = req.body;
  // Retrieve OTP from storage
  const storedOtp = otpStorageMember[phoneNumber];
  if (storedOtp === otp) {
    // OTP matched, clear OTP from storage (for security)
    delete otpStorageMember[phoneNumber];
    // res.send('OTP verified successfully');

    findCompanyMemberByPhone(req.body.phoneNumber, (err, rows) => {
      // -------------------------jwt--------------------------
      const memberToken = jwt.sign(
        { firstName: rows[0].FIRSTNAME },
        jwtSecretKey,
        { expiresIn: "30d" }
      );
      // res.cookie("memberToken", memberToken, { httpOnly: true });
      return res.json({ Status: "OTP verified successfully" ,memberToken});
    });
  } else {
    res.status(400).send("Invalid OTP");
  }
}

// ----------------------------logout--------------------------------

function memberLogout(req, res) {
  // res.clearCookie("memberToken");
  return res.json({ Status: "Successful" });
}

// ----------------------------otp---------------------------
function memberGetOtp(req, res) {
  findCompanyMemberByEmail(req.body.workEmail, (err, rows) => {
    if (err) {
      return res.json({ Error: err });
    }

    if (rows.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        rows[0].PASSWORD,
        (err, response) => {
          if (err) {
            return res.json({ Error: "Error in comparing password" });
          }
          if (response) {
            // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design
            //    let phoneNumber= "+91"+rows[0].PHONENUMBER;
            let phoneNumber = rows[0].PHONENUMBER;

            //    Twilio credentials
            const accountSid = process.env.ACCOUNTSID;
            const authToken = process.env.AUTHTOKEN;
            const client = new twilio(accountSid, authToken);

            // Generate a random 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStorageMember[rows[0].PHONENUMBER] = otp;

            client.messages
              .create({
                body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                from: process.env.TWILIOPHONENUMBER,
                to: phoneNumber,
              })
              .then((message) => {
                res
                  .status(200)
                  .send({
                    message: "OTP sent successfully!",
                    phoneNumber: rows[0].PHONENUMBER,
                  });
              })
              .catch((error) => {
                res.status(500).send({ message: "Failed to send OTP", error });
                console.log(error);
              });

          } else {
            return res.json({ Error: "Password not matched !" });
          }
        }
      );
    } else {
      return res.json({ Error: "No email exists" });
    }
  });
}

// ----------------------------OtpSendAgain------------------------
function memberOtpSendAgain(req, res) {
  // 1- ----- i have to  fimd the requeat data --------


  findCompanyMemberByPhone(req.body.phoneNumber, (err, rows) => {
    // write here
    // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design
    //   let phoneNumber= "+91"+rows[0].PHONENUMBER;
    let phoneNumber = rows[0].PHONENUMBER;

    //    Twilio credentials
    const accountSid = process.env.ACCOUNTSID;
    const authToken = process.env.AUTHTOKEN;
    const client = new twilio(accountSid, authToken);

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorageMember[rows[0].PHONENUMBER] = otp;

    client.messages
      .create({
        body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
        from: process.env.TWILIOPHONENUMBER,
        to: phoneNumber,
      })
      .then((message) => {
        res
          .status(200)
          .send({
            message: "OTP sent successfully!",
            phoneNumber: rows[0].PHONENUMBER,
          });
      })
      .catch((error) => {
        res.status(500).send({ message: "Failed to send OTP", error });
        console.log(error);
      });
  });
}

// ----------------------------------------resetPasword-------------------------------------------

function memberResetPassword(req, res) {
  findCompanyMemberByEmail(req.body.workEmail, (err, rows) => {
    if (err) {
      return res.json({ Error: err });
    }


    if (rows.length > 0) {
      bcrypt.compare(req.body.workEmail, rows[0].WORKEMAIL, (err, response) => {
        const { workEmail, password } = req.body;
        console.log({ workEmail, password });

        const newPassword = req.body.password; // You need a function to generate a new password
        // Update the password in the database
        updateMemberPasswordInDatabase(
          workEmail,
          newPassword,
          (err, result) => {
            if (err) {
              return res.json({ Error: err });
            }
            res.status(200).send({ message: "Password updated successfully" });
          }
        );
      });
    } else {
      return res.json({ Error: "No email exists" });
    }
  });

}

// -----------------------------------------------geta+ all details of company members-----------------------------------

const getCompanyMember = (req, res) => {
  fetchAllCompanyMembers((err, rows) => {
    if (err) {
      console.error("Error executing query: " + err.message);
      res.status(500).json({ error: "Error executing query" });
    } else {
      const companyMember = rows.map((row) => ({
        firstName: row.FIRSTNAME,
        lastName: row.LASTNAME,
        workEmail: row.WORKEMAIL,
        companyName: row.COMPANYNAME,
        memberPosition: row.MEMBERPOSITION,
        phoneNumber: row.PHONENUMBER,
      }));
      res.status(200).json(companyMember);
    }
  });
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 500  * 1024 * 1024 }, // Limit file size to 10MB
}).single("file");

function uploadInvoice(req,res){
  uploadFile(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 10MB" });
    } else if (err) {
      return res.status(500).json({ message: "File upload failed" });
    }

    // File uploaded successfully
    res.status(200).json({ message: "File uploaded successfully" });
  });
}
module.exports = {
  signup,
  login,
  LoginPersonDetails,
  logout,
  getOtp,
  OtpSendAgain,
  resetPassword,

  updateNotification,
  getNotification,

  memberSignup,
  getCompanyMember,
  memberLogin,
  memberGetOtp,
  memberOtpSendAgain,
  memberResetPassword,
  memberLogout,

  uploadInvoice
};

// function in controllers after than
