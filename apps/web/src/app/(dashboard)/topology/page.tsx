"use client";

import React, { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Server, Wifi, Camera, Radio, Router } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "router" | "switch" | "ap" | "camera" | "olt" | "client";
  x: number;
  y: number;
  status: "online" | "offline" | "warning";
  ip?: string;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const initialNodes: Node[] = [
  { id: "router", label: "Core Router", type: "router", x: 400, y: 50, status: "online", ip: "10.100.0.2" },
  { id: "switch1", label: "Core Switch", type: "switch", x: 400, y: 180, status: "online", ip: "192.168.88.3" },
  { id: "ap1", label: "AP-Tower-1", type: "ap", x: 200, y: 300, status: "online", ip: "192.168.88.5" },
  { id: "ap2", label: "AP-Tower-2", type: "ap", x: 400, y: 320, status: "online", ip: "192.168.88.6" },
  { id: "ap3", label: "AP-Tower-3", type: "ap", x: 600, y: 300, status: "warning", ip: "192.168.88.7" },
  { id: "cam1", label: "Cam-Tower-A", type: "camera", x: 150, y: 420, status: "online", ip: "192.168.88.101" },
  { id: "cam2", label: "Cam-Tower-B", type: "camera", x: 650, y: 420, status: "online", ip: "192.168.88.102" },
  { id: "olt1", label: "OLT-Main", type: "olt", x: 400, y: 420, status: "online", ip: "192.168.88.200" },
  { id: "client1", label: "User-100", type: "client", x: 180, y: 500, status: "online" },
  { id: "client2", label: "User-105", type: "client", x: 380, y: 500, status: "online" },
  { id: "client3", label: "User-112", type: "client", x: 620, y: 500, status: "offline" },
];

const edges: Edge[] = [
  { from: "router", to: "switch1", label: "1Gbps" },
  { from: "switch1", to: "ap1" },
  { from: "switch1", to: "ap2" },
  { from: "switch1", to: "ap3" },
  { from: "switch1", to: "olt1" },
  { from: "ap1", to: "cam1" },
  { from: "ap3", to: "cam2" },
  { from: "ap1", to: "client1" },
  { from: "ap2", to: "client2" },
  { from: "ap3", to: "client3" },
];

const typeIcons: Record<string, React.ReactNode> = {
  router: <Router size={18} />,
  switch: <Server size={18} />,
  ap: <Wifi size={18} />,
  camera: <Camera size={18} />,
  olt: <Radio size={18} />,
  client: <Wifi size={14} />,
};

const statusColors = {
  online: "#00FF88",
  offline: "#FF3B6B",
  warning: "#FF8C00",
};

export default function TopologyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw edges
    edges.forEach((edge) => {
      const from = nodes.find((n) => n.id === edge.from);
      const to = nodes.find((n) => n.id === edge.to);
      if (!from || !to) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = "rgba(0, 234, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (edge.label) {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = "#0A1628";
        ctx.fillRect(mx - 20, my - 8, 40, 16);
        ctx.fillStyle = "#7AA3C8";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, mx, my + 3);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const size = node.type === "client" ? 20 : 32;

      // Glow effect
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size + 10);
      gradient.addColorStop(0, `${statusColors[node.status]}33`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 10, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = "#0D1E36";
      ctx.fill();
      ctx.strokeStyle = statusColors[node.status];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#E2F0FF";
      ctx.font = node.type === "client" ? "10px Inter" : "11px Inter";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + size + 14);

      // IP
      if (node.ip) {
        ctx.fillStyle = "#7AA3C8";
        ctx.font = "9px monospace";
        ctx.fillText(node.ip, node.x, node.y + size + 26);
      }
    });
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));

    const clicked = nodes.find((n) => {
      const size = n.type === "client" ? 20 : 32;
      const dx = x - n.x;
      const dy = y - n.y;
      return Math.sqrt(dx * dx + dy * dy) < size;
    });

    if (clicked) {
      setSelectedNode(clicked);
      setDragging(clicked.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));

    setNodes((prev) => prev.map((n) => (n.id === dragging ? { ...n, x, y } : n)));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div>
      <PageHeader title="Network Topology" subtitle="Visual network map with live device status" />

      <div className="flex gap-4 mb-4">
        {["online", "offline", "warning"].map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[s as keyof typeof statusColors] }} />
            <span className="text-sky-text-secondary capitalize">{s}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-card p-1 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-[600px] cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="space-y-3">
          <div className="glass-card p-4">
            <h3 className="font-orbitron text-xs font-semibold text-sky-text-primary mb-3">Device Details</h3>
            {selectedNode ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {typeIcons[selectedNode.type]}
                  <span className="font-semibold text-sky-text-primary">{selectedNode.label}</span>
                </div>
                <div className="text-xs text-sky-text-secondary">Type: <span className="text-sky-text-primary capitalize">{selectedNode.type}</span></div>
                {selectedNode.ip && <div className="text-xs text-sky-text-secondary">IP: <span className="font-mono text-sky-text-primary">{selectedNode.ip}</span></div>}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: statusColors[selectedNode.status] }} />
                  <span className="text-xs capitalize" style={{ color: statusColors[selectedNode.status] }}>{selectedNode.status}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-sky-text-secondary">Click a node to view details</p>
            )}
          </div>

          <div className="glass-card p-4">
            <h3 className="font-orbitron text-xs font-semibold text-sky-text-primary mb-3">Legend</h3>
            <div className="space-y-2">
              {Object.entries(typeIcons).map(([type, icon]) => (
                <div key={type} className="flex items-center gap-2 text-xs text-sky-text-secondary">
                  <span className="text-sky-accent-primary">{icon}</span>
                  <span className="capitalize">{type === "ap" ? "Access Point" : type === "olt" ? "OLT" : type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
