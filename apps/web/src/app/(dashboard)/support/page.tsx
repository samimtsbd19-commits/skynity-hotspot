"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Headphones, MessageCircle, CheckCircle, Clock, AlertCircle, Loader2, Send, User } from "lucide-react";

interface Ticket {
  id: string;
  customerId: string;
  subject: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  senderType: "customer" | "admin";
  senderId: string;
  message: string;
  createdAt: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{ ticket: Ticket; messages: ChatMessage[]; customer: Customer | null } | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/support/${params}`);
      setTickets(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function selectTicket(id: string) {
    setSelectedTicket(id);
    try {
      const res = await api.get(`/support/${id}`);
      setTicketDetail(res.data.data);
    } catch {
      // ignore
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicket) return;
    try {
      await api.post(`/support/${selectedTicket}/messages`, { message: reply.trim() });
      setReply("");
      await selectTicket(selectedTicket);
      await fetchTickets();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to send reply");
    }
  }

  async function updateStatus(status: string) {
    if (!selectedTicket) return;
    try {
      await api.patch(`/support/${selectedTicket}`, { status });
      await selectTicket(selectedTicket);
      await fetchTickets();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to update status");
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "open": return <AlertCircle size={14} className="text-sky-accent-orange" />;
      case "in_progress": return <Clock size={14} className="text-sky-accent-primary" />;
      case "resolved": return <CheckCircle size={14} className="text-sky-accent-green" />;
      default: return <MessageCircle size={14} className="text-sky-text-secondary" />;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "open": return "bg-sky-accent-orange/10 text-sky-accent-orange";
      case "in_progress": return "bg-sky-accent-primary/10 text-sky-accent-primary";
      case "resolved": return "bg-sky-accent-green/10 text-sky-accent-green";
      default: return "bg-sky-text-secondary/10 text-sky-text-secondary";
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Support Tickets" subtitle="Customer support management" />

      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:outline-none focus:border-[#00EAFF]"
        >
          <option value="all">All Tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="text-xs text-sky-text-secondary">
          Total: <span className="text-sky-text-primary font-mono">{tickets.length}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket List */}
        <div className="glass-card overflow-hidden lg:col-span-1">
          <div className="overflow-y-auto max-h-[600px]">
            {loading && tickets.length === 0 && (
              <div className="p-8 text-center text-sky-text-secondary">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            )}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => selectTicket(ticket.id)}
                className={`w-full text-left p-4 border-b border-[rgba(0,234,255,0.1)] hover:bg-[rgba(0,234,255,0.03)] transition-colors ${
                  selectedTicket === ticket.id ? "bg-[rgba(0,234,255,0.05)]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-sky-text-primary truncate">{ticket.subject}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getStatusClass(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-sky-text-secondary">
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span className={ticket.priority === "high" ? "text-sky-accent-red" : ""}>{ticket.priority}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col min-h-[500px]">
          {ticketDetail ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[rgba(0,234,255,0.15)]">
                <div>
                  <h3 className="text-sm font-semibold text-sky-text-primary">{ticketDetail.ticket.subject}</h3>
                  <p className="text-xs text-sky-text-secondary mt-1">
                    From: {ticketDetail.customer?.fullName || "Unknown"} ({ticketDetail.customer?.phone || "—"})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ticketDetail.ticket.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus("resolved")}
                      className="px-3 py-1.5 rounded-lg text-xs bg-sky-accent-green/10 text-sky-accent-green hover:bg-sky-accent-green/20 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                  {ticketDetail.ticket.status === "resolved" && (
                    <button
                      onClick={() => updateStatus("open")}
                      className="px-3 py-1.5 rounded-lg text-xs bg-sky-accent-orange/10 text-sky-accent-orange hover:bg-sky-accent-orange/20 transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[400px]">
                {ticketDetail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                        msg.senderType === "admin"
                          ? "bg-sky-accent-primary/20 text-sky-text-primary"
                          : "bg-[#112240] text-sky-text-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {msg.senderType === "admin" ? (
                          <Headphones size={10} className="text-sky-accent-green" />
                        ) : (
                          <User size={10} className="text-sky-accent-orange" />
                        )}
                        <span className="text-[10px] font-medium">
                          {msg.senderType === "admin" ? "Support Team" : "Customer"}
                        </span>
                      </div>
                      <p>{msg.message}</p>
                      <span className="text-[9px] text-sky-text-secondary/60 mt-1 block">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              {ticketDetail.ticket.status !== "resolved" && (
                <div className="flex items-center gap-2 pt-4 border-t border-[rgba(0,234,255,0.15)]">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    className="flex-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF]"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim()}
                    className="p-2 rounded-lg bg-sky-accent-primary/20 text-sky-accent-primary hover:bg-sky-accent-primary/30 transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sky-text-secondary">
              <div className="text-center">
                <Headphones size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
