import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server as SocketServer } from "socket.io";

export const socketPlugin = fp(async (app: FastifyInstance) => {
  const io = new SocketServer(app.server, {
    cors: {
      origin: process.env.APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    app.log.info(`Socket connected: ${socket.id}`);

    socket.on("join-room", (room: string) => {
      socket.join(room);
      app.log.info(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("leave-room", (room: string) => {
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      app.log.info(`Socket disconnected: ${socket.id}`);
    });
  });

  app.decorate("io", io);

  app.addHook("onClose", async () => {
    io.close();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    io: SocketServer;
  }
}
