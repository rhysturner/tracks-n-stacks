/**
 * Red5 Community Edition Media Server service
 *
 * Handles integration with Red5 Community Edition REST API for:
 * - Stream key generation and validation
 * - Live stream lifecycle management
 * - Recording management
 * - Stream health monitoring
 */
const axios = require('axios');

// Read config at call time so tests can set env vars after requiring the module
const getConfig = () => ({
  host: process.env.RED5_HOST || 'media.tracksnstacks.com',
  port: process.env.RED5_PORT || 5080,
  username: process.env.RED5_USERNAME || 'admin',
  password: process.env.RED5_PASSWORD || '',
  appName: process.env.RED5_APP_NAME || 'live',
  rtmpPort: process.env.RED5_RTMP_PORT || 1935,
});

const getClient = () => {
  const { host, port, username, password } = getConfig();
  const client = axios.create({
    baseURL: `http://${host}:${port}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  if (password) {
    client.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      return config;
    });
  }
  return client;
};

/**
 * Get the RTMP ingest URL for a DJ's stream key
 * DJs configure their streaming software (OBS, etc.) with this URL
 */
const getRtmpIngestUrl = (streamKey) => {
  const { host, rtmpPort, appName } = getConfig();
  return `rtmp://${host}:${rtmpPort}/${appName}/${streamKey}`;
};

/**
 * Get the HLS playback URL for a stream
 */
const getHlsPlaybackUrl = (streamName) => {
  const { host, port, appName } = getConfig();
  return `http://${host}:${port}/${appName}/${streamName}.m3u8`;
};

/**
 * Get the WebRTC playback URL for a stream (low-latency)
 */
const getWebRtcPlaybackUrl = (streamName) => {
  const { host, port, appName } = getConfig();
  return `wss://${host}:${port}/${appName}/${streamName}`;
};

/**
 * Check if a stream is currently live on Red5 Community
 */
const isStreamLive = async (streamName) => {
  const { appName } = getConfig();
  try {
    const response = await getClient().get(
      `/applications/${appName}/streams/${streamName}`
    );
    return response.data && response.data.isLive === true;
  } catch {
    return false;
  }
};

/**
 * Get active streams from Red5 Community
 */
const getActiveStreams = async () => {
  const { appName } = getConfig();
  try {
    const response = await getClient().get(`/applications/${appName}/streams`);
    return response.data || [];
  } catch {
    return [];
  }
};

/**
 * Disconnect / end a stream via Red5 Community API
 */
const disconnectStream = async (streamName) => {
  const { appName } = getConfig();
  try {
    await getClient().delete(
      `/applications/${appName}/streams/${streamName}`
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Get recording status for a stream
 */
const getRecordings = async (streamName) => {
  const { appName } = getConfig();
  try {
    const response = await getClient().get(
      `/applications/${appName}/streams/${streamName}/recordings`
    );
    return response.data || [];
  } catch {
    return [];
  }
};

/**
 * Get stream statistics from Red5 Community
 */
const getStreamStats = async (streamName) => {
  const { appName } = getConfig();
  try {
    const response = await getClient().get(
      `/applications/${appName}/streams/${streamName}/stats`
    );
    return response.data || null;
  } catch {
    return null;
  }
};

module.exports = {
  getRtmpIngestUrl,
  getHlsPlaybackUrl,
  getWebRtcPlaybackUrl,
  isStreamLive,
  getActiveStreams,
  disconnectStream,
  getRecordings,
  getStreamStats,
  getConfig,
};
