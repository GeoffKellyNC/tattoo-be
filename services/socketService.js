const userSockets = {};

const registerSocket = (unx_id, socket) => {
    userSockets[unx_id] = socket;
};

const unregisterSocket = (unx_id) => {
    delete userSockets[unx_id];
};

const emitToUser = (unx_id, event, data) => {
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
