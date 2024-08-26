const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { insertCompanyDetails, fetchAllCompanies, fetchCompanyByEid, searchCompanyByEmail, updateCompanyByEmail } = require("../models/model");


function bufferToHex(buffer) {
  return buffer.toString('hex').toUpperCase();
}

function bufferToHexBinary(buffer) {
  return buffer.map(byte => byte.toString(16).padStart(2, '0')).join('');
}



const insertData = (req, res) => {
  const {
    companyName,
    legalName,
    eid,
    phoneNumber,
    email,
    industryType,
    taxForm,
  } = req.body;

  let companyLogo = null;

  if (req.file) {
    // console.log(req.file)
    companyLogo = bufferToHex(req.file.buffer);

  }

  insertCompanyDetails(companyLogo, companyName, legalName, eid, phoneNumber, email, industryType, taxForm, (err, rows) => {
    if (err) {
      console.error('Error executing query: ' + err.message);
      res.status(500).json({ error: 'Error executing query' });
    } else {
      console.log('Successfully inserted rows.');
      res.status(200).json({ message: 'Successfully inserted rows' });
    }
  });
};






const getCompanies = (req, res) => {
  fetchAllCompanies((err, rows) => {
    if (err) {
      console.error('Error executing query: ' + err.message);
      res.status(500).json({ error: 'Error executing query' });
    } else {
      // console.log('Rows returned from database:', rows);
      const companies = rows.map((row) => ({
        companyLogo: row.COMPANYLOGO,
        companyName: row.COMPANYNAME,
        eid: row.EID,
        legalName: row.LEGALNAME,
        phoneNumber: row.PHONENUMBER,
        email: row.EMAIL,
        industryType: row.INDUSTRYTYPE,
        taxForm: row.TAXFORM,
      }));
      res.status(200).json(companies);
    }
  });
};








const getCompanyByEid = (req, res) => {
  const { eid } = req.query;

  fetchCompanyByEid(eid, (err, rows) => { 
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Error executing query' });
    } else if (rows.length > 0) {
      const company = {
        companyLogo: rows[0].COMPANYLOGO,
        companyName: rows[0].COMPANYNAME,
        legalName: rows[0].LEGALNAME,
        eid: rows[0].EID,
        phoneNumber: rows[0].PHONENUMBER,
        email: rows[0].EMAIL,
        industryType: rows[0].INDUSTRYTYPE,
        taxForm: rows[0].TAXFORM,
      };
      res.status(200).json(company);
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  });
};







const updateCompanyDetails=(req, res)=> {
  // const  email  = req.body.email.toString();
  const { id,
    companyName,
    legalName,
    phoneNumber,
    eid,
    email,
    industryType,
    taxForm,

  }=req.body;
  let companyLogo=null;
  if (req.file) {
    companyLogo = bufferToHex(req.file.buffer);
  }
  updateCompanyByEmail(
    companyLogo,
    companyName,
    legalName,
    phoneNumber,
    eid,
    email,
    industryType,
    taxForm,email, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }

    res.json({ Status: 'Company updated successfully', Result: result });
  });
}


module.exports = {
  insertData,
  getCompanies,
  getCompanyByEid,
  updateCompanyDetails
};

