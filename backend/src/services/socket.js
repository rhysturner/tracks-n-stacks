/**
 * Socket.io handler for real-time features:
 * - Live chat during streams
 * - Viewer count updates
 * - Stream status notifications
 */
const Stream = require('../models/Stream');

const socketHandler = (io) => {
  // Track viewers per stream room
  const streamViewers = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a stream room
    socket.on('join_stream', async ({ streamId }) => {
      if (!streamId) return;

      socket.join(`stream:${streamId}`);

      // Update viewer count
      const current = streamViewers.get(streamId) || new Set();
      current.add(socket.id);
      streamViewers.set(streamId, current);

      const count = current.size;
      io.to(`stream:${streamId}`).emit('viewer_count', { count });

      // Update DB viewer count
      try {
        await Stream.findByIdAndUpdate(streamId, {
          viewerCount: count,
          $max: { peakViewerCount: count },
          $inc: { totalViews: 1 },
        });
      } catch { /* non-critical */ }
    });

    // Leave a stream room
    socket.on('leave_stream', ({ streamId }) => {
      if (!streamId) return;
      socket.leave(`stream:${streamId}`);

      const current = streamViewers.get(streamId);
      if (current) {
        current.delete(socket.id);
        const count = current.size;
        if (count === 0) {
          streamViewers.delete(streamId);
        }
        io.to(`stream:${streamId}`).emit('viewer_count', { count });
      }
    });

    // Live chat message
    socket.on('chat_message', ({ streamId, message, username, avatarUrl }) => {
      if (!streamId || !message) return;
      // Sanitize message length
      const safeMessage = String(message).slice(0, 200);
      io.to(`stream:${streamId}`).emit('chat_message', {
        id: socket.id + Date.now(),
        username,
        avatarUrl,
        message: safeMessage,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnection — clean up all stream rooms
    socket.on('disconnect', () => {
      streamViewers.forEach((viewers, streamId) => {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          const count = viewers.size;
          io.to(`stream:${streamId}`).emit('viewer_count', { count });
          if (count === 0) streamViewers.delete(streamId);
        }
      });
    });
  });
};

module.exports = socketHandler;
