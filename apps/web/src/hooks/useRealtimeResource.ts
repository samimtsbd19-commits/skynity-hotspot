"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

interface ResourceUpdate {
  cpuLoad: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  usedMemoryPercent: number;
  uptime: string;
  boardName: string;
  timestamp: string;
}

export function useRealtimeResource() {
  const { on, joinRoom } = useSocket();
  const [data, setData] = useState<ResourceUpdate | null>(null);

  useEffect(() => {
    joinRoom("resource");
    joinRoom("dashboard");

    const unsubscribe = on<ResourceUpdate>("resource-update", (payload) => {
      setData(payload);
    });

    return () => {
      unsubscribe?.();
    };
  }, [on, joinRoom]);

  return data;
}
