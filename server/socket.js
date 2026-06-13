const { Server } = require('socket.io');
const { chatSocket } = require('./sockets/chat.socket');

const connectedUsers = new Map();
let io = null;

const initSocket = (server, allowedOrigins) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
    });

    io.on('connection', (socket) => {
        console.log('User Connected Successfully ', socket.id);

        // Load chat socket handlers
        chatSocket(socket, io, connectedUsers);

        socket.on('disconnect', () => {
            console.log('User Disconnected ', socket.id);
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                // Broadcast that user is offline
                io.emit('user_offline', { userId: socket.userId });
            }
        });
    });

    return { io, connectedUsers };
};

const getIO = () => {
    return io;
};

const getConnectedUsers = () => {
    return connectedUsers;
};

const emitToUser = (userId, event, data) => {
    if (!io) return;
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
};

module.exports = { initSocket, getIO, getConnectedUsers, emitToUser };
