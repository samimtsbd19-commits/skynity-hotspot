"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, User, Headphones, Loader2 } from "lucide-react";
import portalApi from "@/lib/portal-api";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  senderType: "customer" | "admin";
  message: string;
  createdAt: string;
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchTickets() {
    try {
      const res = await portalApi.get("/portal-api/tickets");
      const tickets: Ticket[] = res.data.data || [];
      const openTicket = tickets.find((t) => t.status === "open" || t.status === "in_progress");
      if (openTicket) {
        setHasTicket(true);
        setTicket(openTicket);
        await fetchMessages(openTicket.id);
      } else {
        setHasTicket(false);
        setTicket(null);
      }
    } catch {
      // ignore
    }
  }

  async function fetchMessages(ticketId: string) {
    try {
      const res = await portalApi.get(`/portal-api/tickets/${ticketId}/messages`);
      setMessages(res.data.data.messages || []);
    } catch {
      // ignore
    }
  }

  async function createTicket() {
    if (!subject.trim() || !newMessage.trim()) return;
    setLoading(true);
    try {
      await portalApi.post("/portal-api/tickets", {
        subject: subject.trim(),
        message: newMessage.trim(),
      });
      setSubject("");
      setNewMessage("");
      await fetchTickets();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !ticket) return;
    setLoading(true);
    try {
      await portalApi.post(`/portal-api/tickets/${ticket.id}/messages`, {
        message: newMessage.trim(),
      });
      setNewMessage("");
      await fetchMessages(ticket.id);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-[#00EAFF] to-[#00FF88] shadow-lg shadow-[#00EAFF]/20 hover:scale-110 transition-transform"
        >
          <MessageCircle size={24} className="text-[#0A1628]" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[500px] glass-card flex flex-col border border-[rgba(0,234,255,0.3)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[rgba(0,234,255,0.15)]">
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-sky-accent-primary" />
              <span className="text-sm font-semibold text-sky-text-primary">Live Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[#112240] text-sky-text-secondary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {!hasTicket ? (
              <div className="space-y-4">
                <p className="text-xs text-sky-text-secondary text-center">
                  Start a new conversation with our support team
                </p>
                <input
                  type="text"
                  placeholder="Subject (e.g. Internet not working)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF]"
                />
                <textarea
                  placeholder="Describe your issue..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF] resize-none"
                />
                <button
                  onClick={createTicket}
                  disabled={loading || !subject.trim() || !newMessage.trim()}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#0A1628] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Start Chat"}
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-accent-primary/10 text-sky-accent-primary">
                    {ticket?.subject}
                  </span>
                </div>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                        msg.senderType === "customer"
                          ? "bg-sky-accent-primary/20 text-sky-text-primary"
                          : "bg-[#112240] text-sky-text-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {msg.senderType === "admin" ? (
                          <Headphones size={10} className="text-sky-accent-green" />
                        ) : (
                          <User size={10} className="text-sky-accent-primary" />
                        )}
                        <span className="text-[10px] font-medium">
                          {msg.senderType === "admin" ? "Support" : "You"}
                        </span>
                      </div>
                      <p>{msg.message}</p>
                      <span className="text-[9px] text-sky-text-secondary/60 mt-1 block">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          {hasTicket && (
            <div className="p-3 border-t border-[rgba(0,234,255,0.15)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF]"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="p-2 rounded-lg bg-sky-accent-primary/20 text-sky-accent-primary hover:bg-sky-accent-primary/30 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
