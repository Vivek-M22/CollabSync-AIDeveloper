import socket from 'socket.io-client';


let socketInstance = null;

// function to initialize the socket instance
export const initializeSocket = (projectId) => {

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    });

    return socketInstance;

}

// function to receive messages from the socket
export const receiveMessage = (eventName, cb) => {
    socketInstance.on(eventName, cb);
}

// function to send messages to the socket  
export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}