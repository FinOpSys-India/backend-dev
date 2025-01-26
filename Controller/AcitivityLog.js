
const multer = require("multer");
const { updateAcitivityLog, getActvityLogCase } = require("../models/model");

// const { updateChatMessages, getChats, getPersonName } = require("../models/model");



const sendNewActivity =  (req, res) => {
 
    const activity =req.body;
    const caseId = activity.chat_id;
    const role = activity.role;  

    var newActivity = {
        accpetedBy: activity.accpetedBy,
        status: activity.messages,
        timestamp: activity.timestamp,
    }  

 updateAcitivityLog(newActivity, caseId,role, (error, results)=>{
  try {
    
    return res.status(200).send("Activity update successfully");
  } catch (err) {
    console.error("Error message:", err);
    return res.status(500).send("Erro AcitivityLog");
  }
});
};


const fetchActvityLog =  (req, res) => {
    const caseId = req.params.ActvityLogCaseId; 

    console.log("caseId", caseId)

  getActvityLogCase(caseId,(err,rows)=>{ 
    if(err){
      res.status(500).json({ error: 'Error executing query' });
    }

   
    if(rows[0]){
      console.log(rows)
       res.status(200).json(rows[0])
    }
  });
     
  };





module.exports = { sendNewActivity, fetchActvityLog  };
