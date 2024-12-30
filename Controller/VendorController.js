const multer = require('multer');
const { createVendorModel, fetchAllVendors, getVendorByVendorId } = require('../models/model');
const storage = multer.memoryStorage();
// ---------------------addingVendor------------------------------------------- 
function createVendor(req, res) {
    createVendorModel(req.body, (err, result) => {
      if (err) {
        return res.json({ Error: err });
      }
  
      return res.json({ Status: result });
    });
  }
  
  function getAllVendors(req,res){
    fetchAllVendors((err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Error executing query' });
      }
        const vendor = rows.map((row) => ({
            vendorId: row.VENDOR_ID,
            vendorName: row.VENDOR_NAME,
            emailAddress: row.EMAIL_ADDRESS,
            phoneNumber: row.PHONE_NUMBER,
            vendorName: row.VENDOR_NAME,
            address: row.STREET_ADDRESS1,
            balanceAmount:row.BALANCE_AMOUNT,
            contactPerson:row.PRIMARY_CONTACT
        }));
        res.status(200).json(vendor);
      }
    )
  }
  const getVendor = (req, res)=>{
    const vendorId = req.params.vendorId;
    getVendorByVendorId(vendorId, (err,rows)=>{
      if(err){
        res.status(500).json({error:'Error executing query'});
      }
      if(rows[0]){
        const vendor = {
          vendorId: rows[0].VENDOR_ID,
          vendorName: rows[0].VENDOR_NAME,
          emailAddress: rows[0].EMAIL_ADDRESS,
          phoneNumber: rows[0].PHONE_NUMBER,
          vendorName: rows[0].VENDOR_NAME,
          address: rows[0].STREET_ADDRESS1,
          balanceAmount:rows[0].BALANCE_AMOUNT,
          contactPerson:rows[0].PRIMARY_CONTACT
      };
      res.status(200).json(vendor);
      }
    })
  }
  
  
  
module.exports = {
    createVendor, 
    getAllVendors,
    getVendor  
};