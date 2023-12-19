const userSockets = {};

const registerSocket = (unx_id, socket) => {
    console.log('Registering socket for user: ', unx_id); //!REMOVE
    const existingSocket = userSockets[unx_id];
    if (existingSocket) {
        return;
    }
    userSockets[unx_id] = socket;

};

const unregisterSocket = (unx_id) => {
    delete userSockets[unx_id];
};

const emitToUser = (unx_id, event, data = null) => {
    
    if (userSockets[unx_id]) {
        userSockets[unx_id].emit(event, data);
    } else {
        console.log(`No active socket found for user: ${unx_id}`);
    }
};

module.exports = {
    registerSocket,
    unregisterSocket,
    emitToUser
};
