const handleJoin = (socket, io, connectedUsers) => (userId) => {
    if (userId) {
        const uid = parseInt(userId, 10);  // always store as integer
        connectedUsers.set(uid, socket.id);
        socket.userId = uid;
        
        // Send current online users to the joining user
        const onlineUserIds = Array.from(connectedUsers.keys());
        socket.emit('online_users', { users: onlineUserIds });
        
        // Broadcast this user is now online
        io.emit('user_online', { userId: uid });
        console.log(`User ${uid} joined with socket ${socket.id}`);
    }
};

const handleSendMessage = (socket, io, connectedUsers) => (data) => {
    const { toUser } = data; 
    const recipientSocketId = connectedUsers.get(toUser);
    
    socket.emit('message_sent', data);
    
    if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', data);
    }
};

const handleTyping = (socket, io, connectedUsers) => (data) => {
    const { toUser } = data;
    const recipientSocketId = connectedUsers.get(toUser);
    if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing', { fromUser: socket.userId });
    }
};

const handleStopTyping = (socket, io, connectedUsers) => (data) => {
    const { toUser } = data;
    const recipientSocketId = connectedUsers.get(toUser);
    if (recipientSocketId) {
        io.to(recipientSocketId).emit('stop_typing', { fromUser: socket.userId });
    }
};

const chatSocket = (socket, io, connectedUsers) => {
    socket.on('join', handleJoin(socket, io, connectedUsers));
    socket.on('send_message', handleSendMessage(socket, io, connectedUsers));
    socket.on('typing', handleTyping(socket, io, connectedUsers));
    socket.on('stop_typing', handleStopTyping(socket, io, connectedUsers));
};

module.exports = { chatSocket };