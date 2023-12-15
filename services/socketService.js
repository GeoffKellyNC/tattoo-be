const userSockets = {};

const registerSocket = (unx_id, socket) => {
    console.log('Registering socket for user: ', unx_id); //!REMOVE
    userSockets[unx_id] = socket;

};

const unregisterSocket = (unx_id) => {
    delete userSockets[unx_id];
};

const emitToUser = (unx_id, event, data = null) => {
    console.log('Emitting to user: ', unx_id); //!REMOVE
    console.log('Event: ', event); //!REMOVE
    console.log('Data: ', data); //!REMOVE
    
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
