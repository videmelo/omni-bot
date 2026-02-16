import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_SERVER_URL}`);

socket.on('connect', () => {
  // console.log('[OMNI]: socket connected:', socket.id);
});

export default socket;
