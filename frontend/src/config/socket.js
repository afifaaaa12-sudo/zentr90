import { io } from 'socket.io-client';

let ioInstance = null;

export const initializeSocket = (projectId) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = io(import.meta.env.VITE_API_URL, {
    auth: {
      token: sessionStorage.getItem('token'),
    },
    query: {
      projectId,
    },
  });

  return ioInstance;
};

export const receiveMessage = (eventName, cb) => {
  if (ioInstance) {
    ioInstance.on(eventName, cb);
  }
};

export const sendMessage = (eventName, data) => {
  if (ioInstance) {
    ioInstance.emit(eventName, data);
  }
};