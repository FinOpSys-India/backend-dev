const socketIo = require('socket.io');

let io;

function initSocket(server) {
    const io = socketIo(server, {
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

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
}

function getIo() {
    return io;
}

module.exports = { initSocket, getIo };
