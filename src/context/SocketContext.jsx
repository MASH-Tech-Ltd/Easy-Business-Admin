import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

let globalSocket = null;
let currentJoinedUserId = null;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(globalSocket);
  const [isConnected, setIsConnected] = useState(globalSocket?.connected || false);

  useEffect(() => {
    const checkAuthAndConnect = () => {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        if (globalSocket) {
          globalSocket.disconnect();
          globalSocket.close();
          globalSocket = null;
        }
        currentJoinedUserId = null;
        setSocket(null);
        setIsConnected(false);
        return;
      }

      let user = null;
      try {
        user = JSON.parse(storedUser);
      } catch (e) {}

      if (currentJoinedUserId && currentJoinedUserId !== user?._id) {
        if (globalSocket) {
          globalSocket.disconnect();
          globalSocket.close();
          globalSocket = null;
        }
        currentJoinedUserId = null;
      }

      if (!globalSocket) {
        globalSocket = io('/', {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });
      }

      const currentSocket = globalSocket;
      if (!currentSocket.connected) {
        currentSocket.connect();
      }

      setSocket(currentSocket);

      const joinRooms = () => {
        if (!user?._id) return;
        if (currentJoinedUserId !== user._id) {
          currentJoinedUserId = user._id;
          currentSocket.emit('join_user_room', user._id);
        }
      };

      const onConnect = () => {
        setIsConnected(true);
        joinRooms();
      };

      const onDisconnect = () => {
        setIsConnected(false);
        currentJoinedUserId = null;
      };

      if (currentSocket.connected) {
        setIsConnected(true);
        joinRooms();
      }

      currentSocket.on('connect', onConnect);
      currentSocket.on('disconnect', onDisconnect);
    };

    checkAuthAndConnect();

    const interval = setInterval(checkAuthAndConnect, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
