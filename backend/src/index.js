require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const socketHandler = require('./services/socket');
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/streams');
const mixRoutes = require('./routes/mixes');
const socialRoutes = require('./routes/social');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Socket.io for real-time stream events
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Attach socket.io to request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/mixes', mixRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
});

// Socket.io event handling
socketHandler(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
  }
  server.listen(PORT, () => {
    console.log(`Tracks-N-Stacks server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };
