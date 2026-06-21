/**
 * Socket.io singleton — initialise once in server.ts, import getIO() anywhere
 */

import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { config } from '../config';

let io: IOServer;

export function initSocket(httpServer: HTTPServer): IOServer {
  io = new IOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`[WS] Client connected: ${socket.id}`);

    // Client subscribes to a specific city for targeted listing updates
    socket.on('subscribe:city', (city: string) => {
      socket.join(`city:${city.toLowerCase()}`);
      logger.info(`[WS] ${socket.id} subscribed to city:${city}`);
    });

    socket.on('unsubscribe:city', (city: string) => {
      socket.leave(`city:${city.toLowerCase()}`);
    });

    // Client subscribes to sync status events
    socket.on('subscribe:sync', () => {
      socket.join('sync');
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[WS] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('[WS] Socket.io initialised');
  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.io not initialised — call initSocket() first');
  return io;
}
