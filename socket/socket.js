const socketIo = require('socket.io');

let io;
let userSockets = {};
function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: 'http://localhost:3000',  // Your frontend URL
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
            console.log(`Mapped User ID: ${userId} to Socket ID: ${socket.id}`);
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


        socket.on('disconnect', () => {
            const userId = Object.keys(userSockets).find((key) => userSockets[key] === socket.id);
            if (userId) {
                delete userSockets[userId];
                console.log(`User ID ${userId} disconnected and removed from mapping.`);
            }        });
    });
}

function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;

}

module.exports = { initSocket, getIo };
