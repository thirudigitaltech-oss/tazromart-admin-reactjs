import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.grabzomart.in';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem('admin_token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // ✅ WebSocket ఫెయిల్ అయితే polling కి మారుతుంది
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

// ✅ Page Back-Forward Cache (BFCache) మరియు Tab Switch ఎర్రర్స్ రాకుండా బ్రౌజర్ ఈవెంట్స్
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (socket) {
      socket.disconnect();
      socket = null; // ✅ పేజీ బ్యాక్‌గ్రౌండ్‌లోకి వెళ్ళినప్పుడు సాకెట్ డిస్‌కనెక్ట్ చేసి నల్ చేస్తుంది
    }
  });

  window.addEventListener('pageshow', (event) => {
    // ✅ యూజర్ వెనక్కి తిరిగి పేజీలోకి వచ్చినప్పుడు కొత్త సాకెట్ ని రీ-కనెక్ట్ చేస్తుంది
    if (event.persisted) {
      getSocket();
    }
  });
}
