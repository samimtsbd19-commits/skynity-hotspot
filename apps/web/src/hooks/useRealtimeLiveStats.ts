"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

interface LiveUser {
  username?: string;
  user?: string;
  id?: string;
  address: string;
  macAddress?: string;
  rxRate: number;
  txRate: number;
  uptime: string;
}

interface LiveStats {
  pppoe: {
    totalUsers: number;
    activeUsers: number;
    totalRxRate: number;
    totalTxRate: number;
    users: LiveUser[];
  };
  hotspot: {
    totalUsers: number;
    activeUsers: number;
    totalRxRate: number;
    totalTxRate: number;
    users: LiveUser[];
  };
  queues: {
    name: string;
    target: string;
    rxRate: number;
    txRate: number;
    maxLimitDown: string;
    maxLimitUp: string;
    disabled: boolean;
    comment: string;
  }[];
  wan: {
    name: string;
    rxRate: number;
    txRate: number;
    rxBytes: string;
    txBytes: string;
    isUp: boolean;
  } | null;
}

export function useRealtimeLiveStats() {
  const { on, joinRoom } = useSocket();
  const [data, setData] = useState<LiveStats | null>(null);

  useEffect(() => {
    joinRoom("livestats");
    joinRoom("dashboard");

    const unsubscribe = on<LiveStats>("livestats-update", (payload) => {
      setData(payload);
    });

    return () => {
      unsubscribe?.();
    };
  }, [on, joinRoom]);

  return data;
}
