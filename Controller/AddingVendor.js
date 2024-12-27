const multer = require('multer');
const { createVendor, fetchAllVendor } = require('../models/model');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// ---------------------addingVendor------------------------------------------- 
function addingVendor(req, res) {

    console.log(req.body)
    createVendor(req.body, (err, result) => {
      console.log("result", result)
      if (err) {
        return res.json({ Error: err });
      }
  
      return res.json({ Status: result });
    });
  }
  





 const getVendor  = async (req, res) => {
  console.log("req.query")
    console.log(req.query)
    
  const  currentPage  = await  req.query.currentPage ;

    console.log("currentPage",currentPage)
      fetchAllVendor(currentPage, (err, rows) => {
          if (err) {
              console.error('Error executing query: ' + err.message);
              res.status(500).json({ error: 'Error executing query' });
          } 
              res.status(200).json(rows );
      });
  };
  
  
  

module.exports = {
    addingVendor,
    getVendor
  };
  
  // function in controllers after than
  