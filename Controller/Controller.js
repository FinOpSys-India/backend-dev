// controller.js

const bcrypt = require("bcrypt");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const Tesseract = require('tesseract.js');
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
  insertInvoice,
  findRole,
  fetchAllVendors,
  getVendorByVendorId
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

function bufferToHex(buffer) {
  return buffer.toString('hex').toUpperCase();
}

function bufferToHexBinary(buffer) {
  return buffer.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function signup(req, res) {
  createUser(req.body, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }
    return res.json({ Status: result });
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
//   let phoneNumber = rows[0].PHONENUMBER;

          //   //    Twilio credentials
          //   const accountSid = process.env.ACCOUNTSID;
          //   const authToken = process.env.AUTHTOKEN;
          //   const client = new twilio(accountSid, authToken);

          //   // Generate a random 6-digit OTP
          //   const otp = Math.floor(100000 + Math.random() * 900000).toString();
          //   otpStorage[rows[0].PHONENUMBER] = otp;

          //   client.messages
          //     .create({
          //       body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
          //       from: process.env.TWILIOPHONENUMBER,
          //       to: phoneNumber,
          //     })
          //     .then((message) => {
          //       res
          //         .status(200)
          //         .send({
          //           message: "OTP sent successfully!",
          //           phoneNumber: rows[0].PHONENUMBER,
          //         });
          //     })
          //     .catch((error) => {
          //       res.status(500).send({ message: "Failed to send OTP", error });
          //       console.log(error);
          //     });
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
          const token = jwt.sign({ firstName: rows[0].FIRSTNAME }, jwtSecretKey, {
            expiresIn: "30d",
          });
          findRole (rows[0].ID, (err,result)=>{
            if (err) {
              return res.json({ Error: err });
            }
            return res.json({ status: "Login Successfully" ,token:token,role:result});
          })

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
function getUser(req,res){
  const email = req.query.email
  console.log(email) 
  findUserByEmail(email, (err, rows) => {
    if (err) {
      return res.json({ Error: err });
    }
    if(rows.length>0){
      return res.json({userId: rows[0].ID});
    }
  })
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

function extractDataFromText(text) {
  let vendorName = text.match(/^(.*?(?:Inc\.|Ltd\.|LLC|Corporation|Company|Corp\.|Co\.|Repair))/im);
  if (!vendorName) {
    vendorName = text.match(/(?:Invoice\s*To|Pay\s*To|From|Sender|Ship\s*To)[:\s]*(.*?)(?=\n|$)/i)?.[1]?.trim() || 'Not found';
  } else {
    vendorName = vendorName[1].trim();
  }
  // Invoice Number
  const invoiceNumber = text.match(/(?:#|Invoice\s*#|No.|Number)[:\s]*([A-Za-z0-9-]+)/i)?.[1] || 'Not found';

  // Tax Amount
  const taxAmount = text.match(/(?:Tax|Sales\s*Tax|VAT|Tax\s*Rate)[:\s]*\$?([\d,]+\.\d{2})/i)?.[1] || 'Not found';

  // Total Amount
  const totalMatch = text.match(/Total\s*[:\s]*\$?([\d,]+\.\d{2})(?!.*[\d,]+\.\d{2})/i);
  const totalAmount = totalMatch ? totalMatch[1] : 'Not found';
  // Invoice Date
  const invoiceDateMatch = text.match(/(?:Invoice\s*Date|Date)[:\s]*(\d{1,2}[\/\-\s]\d{1,2}[\/\-\s]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
  const invoiceDate = invoiceDateMatch ? invoiceDateMatch[1].trim() : 'Not found';

  // Due Date - specifically looking for "DUE DATE" label
  const dueDateMatch = text.match(/(?:Due\s*Date|DUE\s*DATE|Payment\s*Due|PAY\s*DUE|DUEDATE|Due\s*Dt)[:\s]*(\d{1,2}[\/\-\s]\d{1,2}[\/\-\s]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
  const dueDate = dueDateMatch ? dueDateMatch[1].trim() : 'Not found';
  return { vendorName, invoiceNumber, taxAmount, totalAmount, invoiceDate, dueDate };
}
const createInvoice = async (req,res)=>{
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const createBillDetails = JSON.parse(req.body.createBillDetails);
  const { vendorId, amount, invoiceNo, recievingDate, dueDate, dept, glCode } = createBillDetails;
  const file = req.file;
  const fileName = file.originalname;
  const fileData = bufferToHex(file.buffer); // File is stored in memory as a buffer
  const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

  insertInvoice(vendorId, amount,invoiceNo, recievingDate, dueDate, dept, glCode,fileName, fileData,(err, rows)=>{
    if (err) {
      res.status(500).json({ error: 'Error executing query' });
    }
    res.status(200).json({ message: 'Invoice created successfully'});;
  });
}
const uploadInvoice = async (req,res) =>{
      if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const fileName = file.originalname;
    const fileData = bufferToHex(file.buffer); // File is stored in memory as a buffer
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const { data: { text } } = await Tesseract.recognize(base64Data, 'eng');
    const parsedData = extractDataFromText(text);
    // Call the insertInvoice function from the model
    insertInvoice(fileName, fileData, parsedData,(err, rows)=>{
      if (err) {
        res.status(500).json({ error: 'Error executing query' });
      }
      res.status(200).json({ message: 'File uploaded and stored successfully' });
    });
}


module.exports = {
  signup,
  login,
  LoginPersonDetails,
  logout,
  getOtp,
  OtpSendAgain,
  resetPassword,getUser,

  updateNotification,
  getNotification,

  memberSignup,
  getCompanyMember,
  memberLogin,
  memberGetOtp,
  memberOtpSendAgain,
  memberResetPassword,
  memberLogout,

  uploadInvoice,
  createInvoice,
};

// function in controllers after than
