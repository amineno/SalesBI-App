import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('token');
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        // Global Event Listeners
        newSocket.on('notification:new', (data) => {
            toast.success(data.message, { icon: '🔔' });
            queryClient.invalidateQueries(['notifications']);
        });

        newSocket.on('order:new', () => {
            toast('New order received!', { icon: '📦' });
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['dashboard']);
        });

        newSocket.on('order:update', (data) => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['dashboard']);
            queryClient.invalidateQueries(['inventory']);
        });

        newSocket.on('inventory:update', () => {
            queryClient.invalidateQueries(['inventory']);
            queryClient.invalidateQueries(['products']);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, queryClient]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
