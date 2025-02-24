const multer = require('multer');
const { newDepartment, newRole } = require('../models/model');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const updateDepartment= (req, res) => {
    const  memberId = req.body.memberId; 
    const  value = req.body.value; 
  
    console.log(value)
  
    newDepartment(memberId, value,  (error, results) => {
    if (error) {
      console.log('Error in updating Department :', error);
      return res.status(500).json({ message: 'Error in updating Department pending' });
    }

    console.log('updating Department ', results);

    return res.status(200).json({ message: 'updated Department successfully.' });
  });
};


const updateRole= (req, res) => {
    const  memberId = req.body.memberId; 
    const  value = req.body.value; 
  
    console.log(value)
  
    newRole(memberId, value,  (error, results) => {
    if (error) {
      console.log('Error in updating role :', error);
      return res.status(500).json({ message: 'Error in updating role pending' });
    }

    console.log('updating role ', results);

    return res.status(200).json({ message: 'updated role successfully.' });
  });
};

// const checkQuery = `
// SELECT status 
// FROM Invoice 
// WHERE case_id = ?`;
// const updateQuery = `
// UPDATE Invoice 
// SET status = ?, DECLINE_REASON=?, DECLINE_DATE=CURRENT_DATE 
// WHERE case_id = ?`;


module.exports = {
    updateDepartment,
    updateRole

};
