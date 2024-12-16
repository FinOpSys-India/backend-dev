const { updateChatMessages, getChats } = require("../models/model");

const sendMessage =  (req, res) => {
  if (!req.body) {
    return res.status(400).send("Messages is required");
  }
  const chat_Id = req.body.chat_id; 
  const message = {
    user: req.body.user,
    messages: req.body.messages,
    timestamp: req.body.timestamp,
    fileData: req.body.fileData
  }  
 updateChatMessages(message, chat_Id,(error,row)=>{
    if (error){
      res.status(400  ).send("Chat ID not found");
    }
    return  res.status(200);
  });

}

const fetchChats =  (req, res) => {
    const caseId = req.params.caseId; 

  getChats(caseId,(err,rows)=>{ 
    if(err){
      res.status(500).json({ error: ' Error executing query' });
    }
    if(rows[0]){
      res.status(200).json(rows[0])
    }
    else{
        res .status(200).json({
        CHAT_ID:caseId,
        MESSAGES:[],
        CREATED_AT:''
      })
    }

  });
     
  };




module.exports = { sendMessage ,fetchChats };
