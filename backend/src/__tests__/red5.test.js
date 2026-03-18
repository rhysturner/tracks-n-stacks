const red5Service = require('../services/red5');

// Override env for test
process.env.RED5_HOST = 'red5.example.com';
process.env.RED5_RTMP_PORT = '1935';
process.env.RED5_PORT = '5080';
process.env.RED5_APP_NAME = 'live';

describe('Red5 Service', () => {
  describe('getRtmpIngestUrl', () => {
    it('should return a valid RTMP URL for a stream key', () => {
      const url = red5Service.getRtmpIngestUrl('mystreamkey123');
      expect(url).toBe('rtmp://red5.example.com:1935/live/mystreamkey123');
    });
  });

  describe('getHlsPlaybackUrl', () => {
    it('should return a valid HLS URL for a stream name', () => {
      const url = red5Service.getHlsPlaybackUrl('djname_abc123');
      expect(url).toBe('http://red5.example.com:5080/live/djname_abc123.m3u8');
    });
  });

  describe('getWebRtcPlaybackUrl', () => {
    it('should return a WebRTC WSS URL using the same port as HTTP', () => {
      const url = red5Service.getWebRtcPlaybackUrl('djname_abc123');
      expect(url).toMatch(/^wss:\/\//);
      expect(url).toContain('djname_abc123');
      expect(url).toBe('wss://red5.example.com:5080/live/djname_abc123');
    });
  });

  describe('isStreamLive', () => {
    it('should return false when Red5 API is unreachable', async () => {
      const result = await red5Service.isStreamLive('nonexistent_stream');
      expect(result).toBe(false);
    });
  });

  describe('getActiveStreams', () => {
    it('should return an empty array when Red5 API is unreachable', async () => {
      const result = await red5Service.getActiveStreams();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('disconnectStream', () => {
    it('should return false when Red5 API is unreachable', async () => {
      const result = await red5Service.disconnectStream('nonexistent_stream');
      expect(result).toBe(false);
    });
  });
});
