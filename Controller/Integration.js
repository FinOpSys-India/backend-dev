const multer = require('multer');
const { updateQuickbookActiveness, getquickbookIntegration } = require('../models/model');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const quickbookActiveness = (req, res) => {
    const data = req.body;
    
    // Log the received data
    console.log("Received data:", data);
  
    updateQuickbookActiveness(data, (err, result) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ message: 'Error inserting data' });
        } else {
            console.log("Data integration:", result);
            res.status(200).json({ message: 'Data received and saved successfully!' });
        }
    });
};



function getquickbookActiveness(req, res) {
    const  {firstName} = req.query;
    console.log(firstName)

    if (!firstName) {
        return res.status(400).json({ error: 'Missing firstName parameter' });
    }

    getquickbookIntegration(firstName, (err, result) => {
        if (err) {
            return res.status(500).json({ Error: err.message });
        }
        if (!result) {
            return res.status(404).json({ error: 'No data found for the specified name' });
        }
        res.json({ quickbookActiveness: result.quickbookActiveness });
    });
}


  module.exports= {
    quickbookActiveness,
    getquickbookActiveness
  };