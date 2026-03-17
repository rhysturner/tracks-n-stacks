/**
 * Mixes routes tests using Jest mocks for Mongoose models.
 */
jest.mock('../config/database', () => jest.fn().mockResolvedValue(undefined));

// ---- Mock models ----
const mockMixData = {};

const MockMix = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
};

const MockComment = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
};

const MockUser = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.mock('../models/Mix', () => MockMix);
jest.mock('../models/Comment', () => MockComment);
jest.mock('../models/User', () => MockUser);
jest.mock('../models/Follow', () => ({ find: jest.fn() }));
jest.mock('../models/Like', () => ({ find: jest.fn() }));

process.env.JWT_SECRET = 'test_secret_do_not_use_in_prod';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../index');

// Generate a valid token for tests
const testUserId = 'user123456789012345678901';
const authToken = jwt.sign({ id: testUserId }, 'test_secret_do_not_use_in_prod', { expiresIn: '1h' });

const mockUserDoc = {
  _id: testUserId,
  id: testUserId,
  username: 'testdj',
  email: 'testdj@example.com',
  displayName: 'Test DJ',
  role: 'dj',
  select: jest.fn().mockReturnThis(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Auth middleware needs User.findById
  MockUser.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(mockUserDoc),
  });
  MockUser.findByIdAndUpdate.mockResolvedValue(mockUserDoc);
});

describe('GET /api/mixes', () => {
  it('should return empty list when no mixes exist', async () => {
    MockMix.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    MockMix.countDocuments.mockResolvedValue(0);

    const res = await request(app).get('/api/mixes');
    expect(res.status).toBe(200);
    expect(res.body.mixes).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('should return mixes with pagination info', async () => {
    const fakeMixes = [
      { _id: 'mix1', title: 'Mix 1', genre: 'House', dj: { username: 'dj1' } },
      { _id: 'mix2', title: 'Mix 2', genre: 'Techno', dj: { username: 'dj2' } },
    ];
    MockMix.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeMixes),
    });
    MockMix.countDocuments.mockResolvedValue(2);

    const res = await request(app).get('/api/mixes');
    expect(res.status).toBe(200);
    expect(res.body.mixes).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });
});

describe('POST /api/mixes', () => {
  it('should create a mix when authenticated', async () => {
    const newMix = {
      _id: 'mix1',
      title: 'Summer Vibes Vol.1',
      genre: 'House',
      dj: testUserId,
    };
    MockMix.create.mockResolvedValue(newMix);

    const res = await request(app)
      .post('/api/mixes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Summer Vibes Vol.1',
        genre: 'House',
        durationSeconds: 3600,
      });

    expect(res.status).toBe(201);
    expect(res.body.mix.title).toBe('Summer Vibes Vol.1');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/api/mixes').send({
      title: 'Unauthorized Mix',
    });
    expect(res.status).toBe(401);
  });

  it('should return 400 for missing title', async () => {
    const res = await request(app)
      .post('/api/mixes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid visibility value', async () => {
    const res = await request(app)
      .post('/api/mixes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test', visibility: 'invalid' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/mixes/:id', () => {
  it('should return a specific mix', async () => {
    const fakeMix = {
      _id: 'mix1',
      title: 'Test Mix',
      genre: 'Techno',
      visibility: 'public',
      dj: { _id: testUserId, username: 'testdj' },
    };
    MockMix.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeMix),
    });
    MockMix.findByIdAndUpdate.mockResolvedValue(fakeMix);

    const res = await request(app).get('/api/mixes/mix1');
    expect(res.status).toBe(200);
    expect(res.body.mix._id).toBe('mix1');
  });

  it('should return 404 for non-existent mix', async () => {
    MockMix.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get('/api/mixes/nonexistentid');
    expect(res.status).toBe(404);
  });

  it('should return 403 for a private mix', async () => {
    MockMix.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: 'mix1',
        title: 'Private Mix',
        visibility: 'private',
        dj: { _id: 'otheruserid' },
      }),
    });

    const res = await request(app).get('/api/mixes/mix1');
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/mixes/:id', () => {
  it('should update own mix', async () => {
    const existingMix = {
      _id: 'mix1',
      title: 'Original Title',
      dj: testUserId,
      toString: () => testUserId,
      save: jest.fn().mockResolvedValue({ _id: 'mix1', title: 'Updated Title', dj: testUserId }),
    };
    existingMix.dj = { toString: () => testUserId };

    MockMix.findById.mockResolvedValue(existingMix);

    const res = await request(app)
      .put('/api/mixes/mix1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
  });

  it('should return 403 when trying to update another DJ\'s mix', async () => {
    const otherDjMix = {
      _id: 'mix2',
      title: 'Other DJ Mix',
      dj: { toString: () => 'completelydifferentuserid' },
    };
    MockMix.findById.mockResolvedValue(otherDjMix);

    const res = await request(app)
      .put('/api/mixes/mix2')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
  });
});

describe('Mix Comments', () => {
  it('should list comments for a mix', async () => {
    MockComment.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'c1', text: 'Fire track!', user: { username: 'user1' } },
      ]),
    });
    MockComment.countDocuments.mockResolvedValue(1);

    const res = await request(app).get('/api/mixes/mix1/comments');
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBeGreaterThan(0);
  });

  it('should add a comment to a mix when authenticated', async () => {
    const fakeMix = { _id: 'mix1', visibility: 'public' };
    MockMix.findById.mockResolvedValue(fakeMix);
    MockMix.findByIdAndUpdate.mockResolvedValue(fakeMix);

    const fakeComment = {
      _id: 'c2',
      text: 'Awesome mix!',
      timestampSeconds: 120,
      user: { username: 'testdj', displayName: 'Test DJ' },
      populate: jest.fn().mockResolvedValue({
        _id: 'c2',
        text: 'Awesome mix!',
        timestampSeconds: 120,
        user: { username: 'testdj', displayName: 'Test DJ' },
      }),
    };
    MockComment.create.mockResolvedValue(fakeComment);

    const res = await request(app)
      .post('/api/mixes/mix1/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Awesome mix!', timestampSeconds: 120 });

    expect(res.status).toBe(201);
    expect(res.body.comment.text).toBe('Awesome mix!');
  });

  it('should return 401 adding a comment without auth', async () => {
    const res = await request(app)
      .post('/api/mixes/mix1/comments')
      .send({ text: 'Unauthorized comment' });

    expect(res.status).toBe(401);
  });
});

