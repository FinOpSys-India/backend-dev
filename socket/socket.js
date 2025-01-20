const socketIo = require('socket.io');
const { getUser } = require('../Controller/Controller');
const { findUserByEmail } = require('../models/model');

let io;
let userSockets = {}; // Map backend user ID to Socket.io ID

function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: ['http://localhost:3000','http://localhost:3001'],  // Your frontend URL
            methods: ['GET', 'POST'],
        },      
    });

    io.on('connection', (socket) => {
        console.log('User connected with id:', socket.id);

        // Listen for messages from the frontend
        socket.on('sendMessage', (message) => {
            console.log('Message received:', message); // Should log the message from client
            io.emit('newMessage', message); // Emit the message to all connected clients
        });

        socket.on('registerUser', (userId) => {
            userSockets[userId] = socket.id;
            io.emit('update-users', Object.keys(userSockets)); 
            console.log(`Mapped User ID: ${userId} to Socket ID: ${socket.id}`);
        });
        socket.on('start-group-call', ({ callerId, participants }) => {
            participants.forEach((participantId) => {
                findUserByEmail(participantId, (err, rows) => {
                    if (err || rows.length === 0) {
                        console.error(`Error finding participant: ${participantId}`, err);
                        return;
                      }
                    if (userSockets[rows[0].ID]) {
                        console.log(userSockets[rows[0].ID] )

                        io.to(userSockets[rows[0].ID]).emit('incoming-group-call', { callerId ,participants});
                    }
                })
                
            });
        });
        socket.on('join-group-call', ({ userId, signalData, callerId }) => {
            io.to(userSockets[callerId]).emit('user-joined', { userId, signalData });
        });
        socket.on('signal-user', ({ participantId, signalData }) => {
                console.log('Signal received from server:', signalData);

            findUserByEmail(participantId, (err, rows) => {
                if (err || rows.length === 0) {
                    console.error(`Error finding participant: ${participantId}`, err);
                    return;
                  }
                if (userSockets[rows[0].ID]) {
                    io.to(userSockets[rows[0].ID]).emit('receive-signal', { signalData });
                }
            })
            // if (userSockets[userId]) {
            //     io.to(userSockets[userId]).emit('receive-signal', { signalData });
            // }
        });
        // Listen for callUser events
        socket.on('callUser', ({ to, signalData, from }) => {
            const toSocketId = userSockets[to];
            if (toSocketId) {
                io.to(toSocketId).emit('incomingCall', { signal: signalData, from });
            } else {
                console.log(`User ${to} is not connected.`);
            }
        });
        //group call
        socket.on('callGroup', ({ from, groupMembers }) => {
            console.log(`User ${from} is calling group:`, groupMembers);
            groupMembers.forEach((member) => {
                findUserByEmail(member, (err, rows) => {
                    const toSocketId = userSockets[rows[0].ID];
                    console.log(toSocketId)
                    if (toSocketId) {
                        io.to(toSocketId).emit('incomingCall', { from });
                    } else {
                        console.log(`User ${member} is not connected.`);
                    } 
                  })
                
            });
        });
        // Handle disconnect
        socket.on('disconnect', () => {
            const userId = Object.keys(userSockets).find((key) => userSockets[key] === socket.id);
            if (userId) {
                delete userSockets[userId];
                console.log(`User ID ${userId} disconnected and removed from mapping.`);
            }
        });
    });
}

function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}

module.exports = { initSocket, getIo };
