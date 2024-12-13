const { updateChatMessages, getChats } = require("../models/model");

const sendMessage = async (req, res) => {
  const newMessages = req.body;


  console.log("newMessages", newMessages)
  if (!newMessages || !Array.isArray(newMessages) || newMessages.length === 0) {
    return res.status(400).send("Messages are required");
  }

  const chat_Id = req.body[0].chat_id; 

  try {
    const updatedChat = await updateChatMessages(newMessages, chat_Id);
    if (updatedChat && updatedChat.length > 0) {
      res.status(200).json(updatedChat[0]);
    } else {
      res.status(404).send("Chat ID not found");
    }
  } catch (err) {
    console.error("Error updating chat:", err.message);
    res.status(500).send("Internal Server Error");
  }
};



const fetchChats = async (req, res) => {
    const caseId = req.params.caseId; 
    console.log(req.params);

    try {
      const chats = await getChats(caseId);
      console.log(chats);
      res.status(200).json(chats);
    } catch (err) {
      console.error("Error fetching chats:", err.message);
      res.status(500).send("Internal Server Error");
    }
  };




module.exports = { sendMessage ,fetchChats };
