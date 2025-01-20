
const multer = require("multer");

const { updateChatMessages, getChats, getPersonName, UpdatingChat } = require("../models/model");



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


  if(newChat.replyClicked=== true){
    message.replyingUser= newChat.replyingUser,
    message.replyingUserMessage= newChat.replyingUserMessage,
     message.replyClicked= newChat.replyClicked 
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

    console.log("getChats", rows[0])
    if(rows[0]){
      // res.status(200).json(rows[0])

        const chat = {
          CHAT_ID:caseId,
           MESSAGES: rows[0].MESSAGES.map(message => ({
            fileData: message?.fileData ? Buffer.from(message?.fileData, 'binary').toString('base64'): null,
            fileName:  message?.fileData ? message?.fileName: null,
            messages: message.messages,
            timestamp: message.timestamp,
            user: message.user,
            replyingUser: message?.replyingUser,
            replyingUserMessage: message?.replyingUserMessage,
            replyClicked : message?.replyClicked 
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



  const deleteMessage=(req, res)=>{
    
    const { messageIndex, timestamp , chat_id} = req.body 
    const fetchChatQuery = `SELECT messages FROM GroupChats WHERE chat_id = ?`;

      getChats(chat_id), (err, result) => {
      if (err) {
          res.status(500).json({ error: 'Error retrieving chat data' });
          return;
      }

      console.log("result[0]", result[0])
      // Step 2: Parse the messages JSON from the database
      // let messages;
      // try {
      //     messages = JSON.parse(result[0].messages);
      // } catch (parseErr) {
      //     res.status(500).json({ error: 'Error parsing messages JSON' });
      //     return;
      // }

      // // Step 3: Filter out the message matching the messageIndex and timestamp
      // const updatedMessages = messages.filter(
      //     (msg, index) =>
      //         !(index === messageIndex && msg.timestamp === timestamp)
      // );

      // // If no message was removed, it means no match was found
      // if (messages.length === updatedMessages.length) {
      //     res.status(404).json({ error: 'Message not found' });
      //     return;
      // }

      // // Step 4: Convert the updated messages array back to JSON
      // const updatedMessagesString = JSON.stringify(updatedMessages);

      // // Step 5: Update the database with the filtered messages
      // const updateQuery = `UPDATE GroupChats SET messages = ? WHERE chat_id = ?`;

      // db.query(updateQuery, [updatedMessagesString, chat_id], (updateErr) => {
      //     if (updateErr) {
      //         res.status(500).json({ error: 'Error updating messages' });
      //         return;
      //     }

      //     res.status(200).json({ success: true, messages: updatedMessages });
      // });

    }


    UpdatingChat(messageIndex, timestamp,chat_id , ()=>{ 
      // if(err){
      //   res.status(500).json({ error: 'Error executing query' });
      // }
      // else{
      //     res.status(200).json(rows)
      // }
    });

  }

module.exports = { sendMessage ,fetchChats, getChatPersonName, deleteMessage };


// const deleteMessage = (req, res) => {
  // const { messageIndex, timestamp, chat_id } = req.body;

//   // Step 1: Fetch the existing chat messages for the given chat_id
//   const fetchChatQuery = `SELECT messages FROM GroupChats WHERE chat_id = ?`;

//   db.query(fetchChatQuery, [chat_id], (err, result) => {
//       if (err) {
//           res.status(500).json({ error: 'Error retrieving chat data' });
//           return;
//       }

//       if (result.length === 0) {
//           res.status(404).json({ error: 'Chat not found' });
//           return;
//       }

//       // Step 2: Parse the messages JSON from the database
//       let messages;
//       try {
//           messages = JSON.parse(result[0].messages);
//       } catch (parseErr) {
//           res.status(500).json({ error: 'Error parsing messages JSON' });
//           return;
//       }

//       // Step 3: Filter out the message matching the messageIndex and timestamp
//       const updatedMessages = messages.filter(
//           (msg, index) =>
//               !(index === messageIndex && msg.timestamp === timestamp)
//       );

//       // If no message was removed, it means no match was found
//       if (messages.length === updatedMessages.length) {
//           res.status(404).json({ error: 'Message not found' });
//           return;
//       }

//       // Step 4: Convert the updated messages array back to JSON
//       const updatedMessagesString = JSON.stringify(updatedMessages);

//       // Step 5: Update the database with the filtered messages
//       const updateQuery = `UPDATE GroupChats SET messages = ? WHERE chat_id = ?`;

//       db.query(updateQuery, [updatedMessagesString, chat_id], (updateErr) => {
//           if (updateErr) {
//               res.status(500).json({ error: 'Error updating messages' });
//               return;
//           }

//           res.status(200).json({ success: true, messages: updatedMessages });
//       });
//   });
// };
