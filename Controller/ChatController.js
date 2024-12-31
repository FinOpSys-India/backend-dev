const { updateChatMessages, getChats, getPersonName } = require("../models/model");

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
     //   if (error){
  //     res.status(400  ).send("Chat ID not found");
  //   }

  //   getIo().emit('newMessage', message );
  //   return  res.status(200);
  // });
  try {
    const io = getIo(); // Get io instance from socket.js
    io.emit('newMessage', message); // Emit the new message event to all clients
    return res.status(200).send("Message sent successfully");
  } catch (err) {
    console.error("Error emitting message:", err);
    return res.status(500).send("Error emitting message to clients");
  }
});
};


const fetchChats =  (req, res) => {
    const caseId = req.params.caseId; 

  getChats(caseId,(err,rows)=>{ 
    if(err){
      res.status(500).json({ error: 'Error executing query' });
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



  const getChatPersonName=(req, res)=>{

    getPersonName((err,rows)=>{ 
      if(err){
        res.status(500).json({ error: 'Error executing query' });
      }
      else{
          res.status(200).json(rows)
      }
    });

  }



module.exports = { sendMessage ,fetchChats, getChatPersonName };
