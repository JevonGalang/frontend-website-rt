import { io as createSocket } from 'socket.io-client';

let socket = null;
let activeToken = null;

// Reuse one physical WebSocket connection across all React components.
export const io = (url, options = {}) => {
  const token = options.auth?.token ?? null;

  if (!socket || activeToken !== token) {
    socket?.disconnect();
    activeToken = token;
    console.info('[Socket.IO] Membuka koneksi', { url, hasToken: Boolean(token) });
    socket = createSocket(url, {
      ...options,
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socket.on('connect', () => console.info('[Socket.IO] Terhubung', { id: socket.id }));
    socket.on('disconnect', (reason) => console.warn('[Socket.IO] Terputus', { reason }));
    socket.on('connect_error', (error) => console.error('[Socket.IO] Gagal terhubung', error));
    socket.on('sync', (data) => console.info('[Socket.IO] Event sync diterima', data));
  }

  // Each consumer owns only its listeners; no component may close the shared socket.
  const listeners = [];
  return {
    on: (event, handler) => {
      socket.on(event, handler);
      listeners.push([event, handler]);
    },
    off: (event, handler) => socket.off(event, handler),
    emit: socket.emit.bind(socket),
    disconnect: () => listeners.forEach(([event, handler]) => socket.off(event, handler)),
  };
};
