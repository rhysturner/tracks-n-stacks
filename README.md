# 🎧 Tracks-N-Stacks

A live streaming platform for DJs — powered by **Red5 Pro** for RTMP/WebRTC broadcasting, with a social network for discovering, sharing, and archiving DJ mixes.

---

## Features

- 🔴 **Live Streaming** — DJs broadcast via RTMP (OBS, etc.) to a Red5 Pro media server
- 📡 **WebRTC / HLS Playback** — Low-latency in-browser stream viewing
- 💬 **Live Chat** — Real-time chat during streams (Socket.io)
- 🎵 **Mix Archive** — Live recordings saved automatically as replayable mixes
- 👥 **Social Network** — Follow DJs, like and comment on mixes
- 🔍 **Discovery** — Browse by genre, search DJs and mixes
- 🎛️ **DJ Dashboard** — Stream key management, OBS setup guide, stats

---

## Architecture

```
tracks-n-stacks/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/   # Database connection
│   │   ├── middleware/  # JWT auth middleware
│   │   ├── models/   # Mongoose models (User, Stream, Mix, Follow, Like, Comment)
│   │   ├── routes/   # API routes (auth, streams, mixes, social, users)
│   │   └── services/ # Red5 Pro integration, Socket.io handler
│   └── Dockerfile
├── frontend/         # React single-page app
│   ├── src/
│   │   ├── components/  # Reusable UI (Navbar, StreamCard, MixCard, LiveChat)
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Route pages (Home, Dashboard, StreamView, etc.)
│   │   └── services/    # API client
│   └── Dockerfile
└── docker-compose.yml
```

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Streaming  | Red5 Pro (RTMP ingest, WebRTC/HLS out)  |
| Backend    | Node.js, Express, Socket.io             |
| Database   | MongoDB (Mongoose)                      |
| Auth       | JWT (JSON Web Tokens)                   |
| Frontend   | React, React Router                     |
| Real-time  | Socket.io (live chat, viewer counts)    |
| Containers | Docker, Docker Compose                  |

---

## Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or Atlas)
- **Red5 Pro Media Server** — [Get a license](https://www.red5.net/) or use Red5 Pro cloud

---

## Quick Start

### 1. Clone and install dependencies

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Red5 Pro details
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Red5 Pro

Edit `backend/.env` with your Red5 Pro settings:

```env
RED5_HOST=your-red5-server.com
RED5_PORT=5080
RED5_RTMP_PORT=1935
RED5_APP_NAME=live
RED5_API_KEY=your_api_key
```

### 3. Run in development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

### 4. Run with Docker Compose

```bash
# Copy and configure env
cp backend/.env.example .env

# Start all services
docker-compose up --build
```

Open: http://localhost:3000

---

## OBS Streaming Setup

1. Open OBS → Settings → Stream
2. Set **Service** to `Custom`
3. Set **Server** to: `rtmp://your-red5-host:1935/live`
4. Set **Stream Key** to your key from the DJ Dashboard
5. Start streaming!

---

## API Reference

### Auth
| Method | Endpoint                       | Description                    |
|--------|-------------------------------|--------------------------------|
| POST   | `/api/auth/register`          | Register a new DJ account      |
| POST   | `/api/auth/login`             | Login and receive JWT          |
| GET    | `/api/auth/me`                | Get current user (auth)        |
| POST   | `/api/auth/refresh-stream-key`| Regenerate RTMP stream key     |

### Streams
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/streams`        | List live streams        |
| GET    | `/api/streams/:id`    | Get a single stream      |
| POST   | `/api/streams`        | Start a stream (auth)    |
| PUT    | `/api/streams/:id`    | Update stream (auth)     |
| DELETE | `/api/streams/:id`    | End stream (auth)        |

### Mixes
| Method | Endpoint                          | Description               |
|--------|----------------------------------|---------------------------|
| GET    | `/api/mixes`                     | List public mixes         |
| GET    | `/api/mixes/feed`                | Personalized feed (auth)  |
| GET    | `/api/mixes/:id`                 | Get a mix                 |
| POST   | `/api/mixes`                     | Upload a mix (auth)       |
| PUT    | `/api/mixes/:id`                 | Update mix (auth)         |
| DELETE | `/api/mixes/:id`                 | Delete mix (auth)         |
| GET    | `/api/mixes/:id/comments`        | List comments             |
| POST   | `/api/mixes/:id/comments`        | Add comment (auth)        |

### Social
| Method | Endpoint                              | Description           |
|--------|--------------------------------------|-----------------------|
| POST   | `/api/social/follow/:userId`         | Follow a DJ (auth)    |
| DELETE | `/api/social/follow/:userId`         | Unfollow a DJ (auth)  |
| GET    | `/api/social/followers/:userId`      | Get follower list     |
| GET    | `/api/social/following/:userId`      | Get following list    |
| POST   | `/api/social/like/:type/:id`         | Like a mix/stream     |
| DELETE | `/api/social/like/:type/:id`         | Unlike a mix/stream   |

---

## Running Tests

```bash
cd backend
npm test
```

Tests use Jest with mocked Mongoose models (no MongoDB required to run tests).

---

## Socket.io Events

| Event           | Direction     | Description                       |
|-----------------|---------------|-----------------------------------|
| `join_stream`   | Client → Server | Join a stream room               |
| `leave_stream`  | Client → Server | Leave a stream room              |
| `chat_message`  | Bidirectional | Send/receive live chat messages   |
| `viewer_count`  | Server → Client | Current viewer count update      |
| `stream_started`| Server → Client | Broadcast when a stream goes live|
| `stream_ended`  | Server → Client | Broadcast when stream ends       |

