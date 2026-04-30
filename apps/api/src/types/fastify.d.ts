import { FastifyRequest, FastifyReply } from "fastify";
import { Server as SocketServer } from "socket.io";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    redis: Redis;
    io: SocketServer;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      orgId: string | null;
    };
  }
}
