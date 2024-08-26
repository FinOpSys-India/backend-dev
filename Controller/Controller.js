// controller.js

const bcrypt = require('bcrypt');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserByPhone, updatePasswordInDatabase, createMemberOfCompany, findCompanyMemberByEmail, findCompanyMemberByPhone, updateMemberPasswordInDatabase, createAcessControl, getAccessControl, fetchAllCompanyMembers, getLoginPersonDetails } = require('../models/model');
const { message } = require('antd');

const saltRounds = 10;
const saltRoundsMember = 10;
const loginName="";
const jwtSecretKey = "jwt-secret-key";

const cooCookie = require("js-cookie")

// Temporary storage for OTPs (for demo purposes, use a secure storage in production)
let otpStorage = {};
let otpStorageMember = {};

function signup(req, res) {
    // console.log("detail"+req.body.FIRSTNAME)
    createUser(req.body, (err, result) => {

        console.log("detail"+res[0])
        if (err) {
            return res.json({ Error: err });
        }
        res.json({ Status: result });
    });
}





// ---------------------------------------------------login-----------------------------------

function login(req, res) {

    const { phoneNumber, otp } = req.body;
    console.log("res" + req)
    // Retrieve OTP from storage
   const storedOtp = otpStorage[phoneNumber];
   console.log("sharedOtp" + storedOtp)
   if (storedOtp === otp) {
        // OTP matched, clear OTP from storage (for security)
        delete otpStorage[phoneNumber];
        // res.send('OTP verified successfully');

        findUserByPhone(req.body.phoneNumber, (err, rows) => {
            // -------------------------jwt--------------------------
            const token = jwt.sign({ firstName: rows[0].FIRSTNAME }, jwtSecretKey, { expiresIn: "30d" });
            res.cookie("token", token, { httpOnly: true });
            console.log("name"+" "+rows[0].FIRSTNAME)

            // loginName = rows[0].FIRSTNAME;
            return res.json({ Status:  'OTP verified successfully'});
        });

    } else {
       
        res.status(400).send('Invalid OTP');
    }
}



// ----------------------------logout--------------------------------

function logout(req, res) {

    console.log(res)
    res.clearCookie("token");
    return res.json({ Status: "Successful" });
}








// ----------------------------otp---------------------------
function getOtp(req, res){
    findUserByEmail(req.body.workEmail, (err, rows) => {
        if (err) {
            return res.json({ Error: err });
        }

        if (rows.length > 0) {
            bcrypt.compare(req.body.password.toString(), rows[0].PASSWORD, (err, response) => {
                if (err) {
                    return res.json({ Error: "Error in comparing password" });
                }
                if (response) {

                    // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design 
                //    let phoneNumber= "+91"+rows[0].PHONENUMBER;
                   let phoneNumber= rows[0].PHONENUMBER;
                   console.log(phoneNumber)
                    
                   
                 //    Twilio credentials
                   const accountSid = process.env.ACCOUNTSID;
                   const authToken = process.env.AUTHTOKEN;
                   const client = new twilio(accountSid, authToken);

                    // Generate a random 6-digit OTP
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    otpStorage[rows[0].PHONENUMBER] = otp;
                    console.log(otpStorage)

                    client.messages
                    .create({
                        body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                        from: '+12515777175',
                        to: phoneNumber
                    })
                    .then((message) => {res.status(200).send({ message: 'OTP sent successfully!' , phoneNumber: rows[0].PHONENUMBER})
                                         console.log(message)
                    })
                    .catch((error) => {res.status(500).send({ message: 'Failed to send OTP', error })
                                console.log(error)
                   });


                   
                    // // -------------------------jwt--------------------------
                    // const token = jwt.sign({ firstName: rows[0].firstName }, jwtSecretKey, { expiresIn: "30d" });
                    // res.cookie("token", token, { httpOnly: true });
                    // return res.json({ Status: "Successful" });


                } else {
                    return res.json({ Error: "Password not matched !" });
                }
            });
        } else {
            return res.json({ Error: "No email exists" });
        }
    });

}


// ----------------------------OtpSendAgain------------------------
function OtpSendAgain(req, res){
    

    // 1- ----- i have to  fimd the requeat data --------

    // const phoneNumber = req.body;
    console.log("my data "+req)

        findUserByPhone(req.body.phoneNumber, (err, rows) => {     // write here 
              // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design 
            //   let phoneNumber= "+91"+rows[0].PHONENUMBER;
            let phoneNumber= rows[0].PHONENUMBER;
              console.log(phoneNumber)
               
              
            //    Twilio credentials
              const accountSid = process.env.ACCOUNTSID;
              const authToken = process.env.AUTHTOKEN;
              const client = new twilio(accountSid, authToken);

               // Generate a random 6-digit OTP
               const otp = Math.floor(100000 + Math.random() * 900000).toString();
               otpStorage[rows[0].PHONENUMBER] = otp;
               console.log(otpStorage)

               client.messages
               .create({
                   body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                   from: '+12515777175',
                   to: phoneNumber
               })
               .then((message) => {res.status(200).send({ message: 'OTP sent successfully!' , phoneNumber: rows[0].PHONENUMBER})
                                    console.log(message)
               })
               .catch((error) => {res.status(500).send({ message: 'Failed to send OTP', error })
                           console.log(error)
              });
        });


}





// ----------------------------------------resetPasword-------------------------------------------

function resetPassword(req,res){

    findUserByEmail(req.body.workEmail, (err, rows) => {
        if (err) {
            return res.json({ Error: err });
        }

        console.log(rows)
        // let workEmail = rows[0].WORKEMAIL
        // let currentPassword = rows[0].PASSWORD;

        if (rows.length > 0) {
            bcrypt.compare(req.body.workEmail, rows[0].WORKEMAIL, (err, response) => {
                const { workEmail, password } = req.body;
                console.log({workEmail, password })

                const newPassword = req.body.password; // You need a function to generate a new password
                console.log(newPassword + "new ")
                // Update the password in the database
                updatePasswordInDatabase(workEmail, newPassword, (err, result) => {
                    if (err) {
                        return res.json({ Error: err });
                    }
                    
                    console.log(result +"data")
                    // return res.json({ message: 'Password updated successfully' });
                    // res.json({ Status: "Successfully" });
                    res.status(200).send({ message: 'Password updated successfully' });
                    console.log(message);
                });
            })
        }
        else{
            return res.json({ Error: "No email exists" });   
        }
    })

    // console.log(rows)

}





// ---------------------------temp access control -----------------------

function updateNotification(req, res){
    // console.log(res.body)
    const isCheckedNotification  = req.body;
    console.log('Notification status:', isCheckedNotification);
    // // Add logic to handle the received data
    // res.send({  isCheckedNotification , message: 'Notification status updated successfully!' });

    createAcessControl(isCheckedNotification, (err, result) => {

        // console.log(req.body.phoneNumber)
        if (err) {
            return res.json({ Error: err });
        }
        res.json({ Status: result });
    });
}




function LoginPersonDetails(req, res) {

    getLoginPersonDetails(req.firstName, (err, result) => {
        if (err) {
            return res.status(500).json({ Error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log("User Details: ", result);
        res.json(result);
    });
}


function getNotification(req, res){
    
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

        // console.log(req.body.phoneNumber)
        if (err) {
            return res.json({ Error: err });
        }
        res.json({ Status: result });
    });
}



// -------------------login-----------------------------

function memberLogin(req, res) {

    const { phoneNumber, otp } = req.body;
    console.log("res" + req)
    // Retrieve OTP from storage
   const storedOtp = otpStorageMember[phoneNumber];
   console.log("sharedOtp" + storedOtp)
   if (storedOtp === otp) {
        // OTP matched, clear OTP from storage (for security)
        delete otpStorageMember[phoneNumber];
        // res.send('OTP verified successfully');

        findCompanyMemberByPhone(req.body.phoneNumber, (err, rows) => {
            // -------------------------jwt--------------------------
            const memberToken = jwt.sign({ firstName: rows[0].FIRSTNAME }, jwtSecretKey, { expiresIn: "30d" });
                res.cookie("memberToken", memberToken, { httpOnly: true });
            return res.json({ Status:  'OTP verified successfully'});
        });

    } else {
       
        res.status(400).send('Invalid OTP');
    }
}



// ----------------------------logout--------------------------------

function memberLogout(req, res) {

    console.log(res)
    res.clearCookie("memberToken");
    return res.json({ Status: "Successful" });
}





// ----------------------------otp---------------------------
function memberGetOtp(req, res){
    findCompanyMemberByEmail(req.body.workEmail, (err, rows) => {

        console.log("rows" + rows)
        console.log("err" + err)
        if (err) {
            return res.json({ Error: err });
        }

        if (rows.length > 0) {
            bcrypt.compare(req.body.password.toString(), rows[0].PASSWORD, (err, response) => {
                if (err) {
                    return res.json({ Error: "Error in comparing password" });
                }
                if (response) {

                    // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design 
                //    let phoneNumber= "+91"+rows[0].PHONENUMBER;
                   let phoneNumber= rows[0].PHONENUMBER;
                   console.log(phoneNumber)
                    
                   
                 //    Twilio credentials
                   const accountSid = process.env.ACCOUNTSID;
                   const authToken = process.env.AUTHTOKEN;
                   const client = new twilio(accountSid, authToken);

                    // Generate a random 6-digit OTP
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    otpStorageMember[rows[0].PHONENUMBER] = otp;
                    console.log(otpStorageMember)

                    client.messages
                    .create({
                        body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                        from: '+12515777175',
                        to: phoneNumber
                    })
                    .then((message) => {res.status(200).send({ message: 'OTP sent successfully!' , phoneNumber: rows[0].PHONENUMBER})
                                         console.log(message)
                    })
                    .catch((error) => {res.status(500).send({ message: 'Failed to send OTP', error })
                                console.log(error)
                   });


                   
                    // // -------------------------jwt--------------------------
                    // const token = jwt.sign({ firstName: rows[0].firstName }, jwtSecretKey, { expiresIn: "30d" });
                    // res.cookie("token", token, { httpOnly: true });
                    // return res.json({ Status: "Successful" });


                } else {
                    return res.json({ Error: "Password not matched !" });
                }
            });
        } else {
            return res.json({ Error: "No email exists" });
        }
    });

}


// ----------------------------OtpSendAgain------------------------
function memberOtpSendAgain(req, res){
    

    // 1- ----- i have to  fimd the requeat data --------

    // const phoneNumber = req.body;
    console.log("my data "+req)

    findCompanyMemberByPhone(req.body.phoneNumber, (err, rows) => {     // write here 
              // let phoneNumber= rows[0].COUNTRYCODE+rows[0].PHONENUMBER;                                                              add country code in design 
            //   let phoneNumber= "+91"+rows[0].PHONENUMBER;
            let phoneNumber= rows[0].PHONENUMBER;
              console.log(phoneNumber)
               
              
            //    Twilio credentials
              const accountSid = process.env.ACCOUNTSID;
              const authToken = process.env.AUTHTOKEN;
              const client = new twilio(accountSid, authToken);

               // Generate a random 6-digit OTP
               const otp = Math.floor(100000 + Math.random() * 900000).toString();
               otpStorageMember[rows[0].PHONENUMBER] = otp;
               console.log(otpStorageMember)

               client.messages
               .create({
                   body: ` Code verfication from finopsys :  Your OTP is ${otp}`,
                   from: '+12515777175',
                   to: phoneNumber
               })
               .then((message) => {res.status(200).send({ message: 'OTP sent successfully!' , phoneNumber: rows[0].PHONENUMBER})
                                    console.log(message)
               })
               .catch((error) => {res.status(500).send({ message: 'Failed to send OTP', error })
                           console.log(error)
              });
        });


}





// ----------------------------------------resetPasword-------------------------------------------

function memberResetPassword(req,res){

    findCompanyMemberByEmail(req.body.workEmail, (err, rows) => {
        if (err) {
            return res.json({ Error: err });
        }

        console.log(rows)
        // let workEmail = rows[0].WORKEMAIL
        // let currentPassword = rows[0].PASSWORD;

        if (rows.length > 0) {
            bcrypt.compare(req.body.workEmail, rows[0].WORKEMAIL, (err, response) => {
                const { workEmail, password } = req.body;
                console.log({workEmail, password })

                const newPassword = req.body.password; // You need a function to generate a new password
                console.log(newPassword + "new ")
                // Update the password in the database
                updateMemberPasswordInDatabase(workEmail, newPassword, (err, result) => {
                    if (err) {
                        return res.json({ Error: err });
                    }
                    
                    console.log(result +"data")
                    // return res.json({ message: 'Password updated successfully' });
                    // res.json({ Status: "Successfully" });
                    res.status(200).send({ message: 'Password updated successfully' });
                    console.log(message);
                });
            })
        }
        else{
            return res.json({ Error: "No email exists" });   
        }
    })

    // console.log(rows)

}






// -----------------------------------------------geta+ all details of company members-----------------------------------


const getCompanyMember = (req, res) => {
    fetchAllCompanyMembers((err, rows) => {
      if (err) {
        console.error('Error executing query: ' + err.message);
        res.status(500).json({ error: 'Error executing query' });
      } 
      else {
        // console.log('Rows returned from database:', rows);
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
    memberLogout

};


// function in controllers after than 