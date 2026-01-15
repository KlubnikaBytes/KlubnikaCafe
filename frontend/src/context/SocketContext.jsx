import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

// Default context value
const SocketContext = createContext({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const { user, isAuthenticated, token } = useAuth(); // Get token directly from Auth

  // Determine URL (Default to localhost:5000 if env is missing)
  const fullApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const SOCKET_URL = fullApiUrl.replace("/api", "");

  useEffect(() => {
    // Debugging Logs
    console.log("🔄 SocketContext: Checking Connection...");
    console.log("   - IsAuthenticated:", isAuthenticated);
    console.log("   - User ID:", user?._id || user?.id);
    console.log("   - Token Available:", !!token);

    // Only connect if we are authenticated and have a user
    if (isAuthenticated && user && !socketRef.current) {
      console.log("🚀 Initializing Socket Connection to:", SOCKET_URL);

      const newSocket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        // Pass userId in query for robust connection
        query: { 
            userId: user._id || user.id 
        },
      });

      // --- LISTENERS ---
      newSocket.on("connect", () => {
        console.log("✅ WEB SOCKET CONNECTED! ID:", newSocket.id);
        
        // Auto-join room on connect
        const userId = user._id || user.id;
        if (userId) {
            const roomName = String(userId);
            console.log(`👤 Auto-Joining Room: ${roomName}`);
            newSocket.emit("joinRoom", roomName);
        }
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ WEB SOCKET CONNECTION ERROR:", err.message);
      });

      newSocket.on("disconnect", (reason) => {
        console.warn("⚠️ WEB SOCKET DISCONNECTED:", reason);
      });

      // Save to ref and state
      socketRef.current = newSocket;
      setSocket(newSocket);

    } else if (!isAuthenticated && socketRef.current) {
      // Cleanup if logged out
      console.log("🔒 Logged out. Closing socket.");
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  }, [isAuthenticated, user, token, SOCKET_URL]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
