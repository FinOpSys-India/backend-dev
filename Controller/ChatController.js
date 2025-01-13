
const multer = require("multer");

const { updateChatMessages, getChats, getPersonName } = require("../models/model");
const { getIo } = require("../socket/socket");



function bufferToHex(buffer) {
  return buffer.toString('hex').toUpperCase();
}

function bufferToHexBinary(buffer) {
  return buffer.map(byte => byte.toString(16).padStart(2, '0')).join('');
}


const sendMessage =  (req, res) => {
  if (!req.body) {
     return res.status(400).json({ message: 'No file uploaded' });
   }
  const newChat = JSON.parse(req.body.newChat);
  const chat_Id = newChat.chat_id; 

   if (req.file) {
    const file = req.file;
    const fileName = file.originalname;
    const fileData = bufferToHex(file.buffer); // File is stored in memory as a buffer
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
   
    var message = {
      user: newChat.user,
      messages: newChat.messages,
      timestamp: newChat.timestamp,
      fileName:fileName,
      fileData :fileData
    }  
  }
  else{
    var message = {
      user: newChat.user,
      messages: newChat.messages,
      timestamp: newChat.timestamp,
    }  
  }
 updateChatMessages(message, chat_Id,(error,row)=>{
 
  try {
    const io = getIo    (); // Get io instance from socket.js
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
      // res.status(200).json(rows[0])

        const chat = {
          CHAT_ID:caseId,
          MESSAGES: rows[0].MESSAGES.map(message => ({
            fileData: message?.fileData ? Buffer.from(message?.fileData, 'binary').toString('base64'): null,
            fileName:  message?.fileData ? message?.fileName: null,
            messages: message.messages,
            timestamp: message.timestamp,
            user: message.user
          })),
          CREATED_AT: rows[0].CREATED_AT,
        };
        res.status(200).json(chat);
    }
    else{
        res.status(200).json({
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
