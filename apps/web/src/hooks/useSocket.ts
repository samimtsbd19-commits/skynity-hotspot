"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Socket connected
      socket.emit("join-room", "dashboard");
    });

    socket.on("disconnect", () => {
      // Socket disconnected
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit("join-room", room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit("leave-room", room);
  }, []);

  const on = useCallback(<T = any>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, joinRoom, leaveRoom, on };
}
