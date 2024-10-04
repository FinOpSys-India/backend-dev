const express = require('express');
const cors = require('cors');
const { signup, login, getOtp, OtpSendAgain, resetPassword,  memberSignup, logout, memberLogin, memberOtpSendAgain, memberGetOtp, memberResetPassword, memberLogout, updateNotification, getNotification, getCompanyMember, LoginPersonDetails, uploadInvoice } = require('../Controller/Controller');
const verifyUser = require('../middleware/verifyUser'); 
const verifyMember = require('../middleware/verifyMember');
const multer = require('multer');
const companyController = require('../Controller/companyController');
const { initiateAuth, handleCallback } = require('../models/model');
const { quickbookActiveness, getquickbookActiveness } = require('../Controller/Integration');
const { getInvoices, AQSectionAccept } = require('../Controller/AQController');

const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // Limit file size to 5MB
    },
  });



router.post("/signup", signup);
router.post("/login", login);
router.get("/", verifyUser, (req, res) => {
    return res.json({ Status: "Successful", firstName: req.firstName });
});
router.get("/get-person-details", LoginPersonDetails);
router.post("/codeVerfication", getOtp);
router.post("/send-again", OtpSendAgain)
router.post("/reset-password", resetPassword)
router.get("/logout", logout);



// ---------access control-------------
router.post('/update-notification', updateNotification)
router.get("/get-accessControl", getNotification);



// ---------------Memeber section-------------
router.post("/signup-member", memberSignup);
router.get('/get-company-member', getCompanyMember);
router.post("/login-member", memberLogin);
router.post("/send-again-member", memberOtpSendAgain);
router.post("/reset-password-member", memberResetPassword);
router.post("/codeVerification-member", memberGetOtp);
router.get("/home-member", verifyMember, (req, res) => {
    return res.json({ Status: "Successful", firstName: req.firstName });
});
router.get("/logout-member", memberLogout);





// --------company detrails-----------------------
router.post('/insertData', upload.single('companyLogo'), companyController.insertData);
router.get('/getCompanies', companyController.getCompanies);
router.get('/getCompanyByEid', companyController.getCompanyByEid);
// router.get('/getCompanies/email', companyController.updateCompanyDetails);
router.post('/update-company-details',upload.single('companyLogo'), companyController.updateCompanyDetails);



// --------------- Quick vbook-------------
router.get('/auth', initiateAuth);
router.get('/callback', handleCallback);
router.post('/update-quickbook', quickbookActiveness);
router.get("/get-updated-quickbook", getquickbookActiveness);


//--upload button--
router.post("/upload", upload.single('file'), uploadInvoice)

// router.post('/accept', AQSectionAccept);
router.get('/get-invoices',getInvoices )

module.exports = router;


