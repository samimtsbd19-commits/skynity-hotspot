"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

interface BandwidthUpdate {
  name: string;
  rxRate: number;
  txRate: number;
  rxBytes: string;
  txBytes: string;
  isUp: boolean;
  timestamp: string;
}

export function useRealtimeBandwidth() {
  const { on, joinRoom } = useSocket();
  const [data, setData] = useState<BandwidthUpdate[]>([]);

  useEffect(() => {
    joinRoom("bandwidth");
    joinRoom("dashboard");

    const unsubscribe = on<BandwidthUpdate[]>("bandwidth-update", (payload) => {
      setData(payload);
    });

    return () => {
      unsubscribe?.();
    };
  }, [on, joinRoom]);

  return data;
}
