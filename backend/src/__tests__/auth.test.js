/**
 * Auth routes integration tests using Jest mocks for Mongoose models.
 */
jest.mock('../config/database', () => jest.fn().mockResolvedValue(undefined));

// ---- Mock User model ----
const mockUsers = new Map();
let mockUserIdCounter = 1;

const MockUser = jest.fn().mockImplementation((data) => {
  const id = String(mockUserIdCounter++);
  const user = {
    ...data,
    _id: id,
    id,
    role: data.role || 'dj',
    followerCount: 0,
    followingCount: 0,
    mixCount: 0,
    totalViews: 0,
    isStreaming: false,
    isVerified: false,
    streamKey: data.streamKey || 'mockstreamkey',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    comparePassword: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({ ...data, _id: id, id }),
  };
  return user;
});

MockUser.findOne = jest.fn();
MockUser.findById = jest.fn();
MockUser.findByIdAndUpdate = jest.fn();
MockUser.create = jest.fn();

jest.mock('../models/User', () => MockUser);

// ---- Set env ----
process.env.JWT_SECRET = 'test_secret_do_not_use_in_prod';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../index');

beforeEach(() => {
  jest.clearAllMocks();
  mockUserIdCounter = 1;
  mockUsers.clear();
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return token', async () => {
    MockUser.findOne.mockResolvedValue(null);
    const salt = await bcrypt.genSalt(1);
    const hashedPassword = await bcrypt.hash('SecurePass1!', salt);
    MockUser.create.mockResolvedValue({
      _id: '1',
      id: '1',
      username: 'djtest',
      email: 'djtest@example.com',
      password: hashedPassword,
      displayName: 'DJ Test',
      role: 'dj',
      streamKey: 'abc123streamkey',
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'djtest',
      email: 'djtest@example.com',
      password: 'SecurePass1!',
      displayName: 'DJ Test',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('djtest');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'djtest2',
      email: 'not-an-email',
      password: 'SecurePass1!',
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'djtest3',
      email: 'djtest3@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid username characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'dj test!',
      email: 'dj@example.com',
      password: 'SecurePass1!',
    });
    expect(res.status).toBe(400);
  });

  it('should return 409 for duplicate username', async () => {
    MockUser.findOne.mockResolvedValue({
      _id: '1',
      username: 'duplicatedj',
      email: 'other@example.com',
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'duplicatedj',
      email: 'second@example.com',
      password: 'SecurePass1!',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const salt = await bcrypt.genSalt(1);
    const hashedPassword = await bcrypt.hash('CorrectPass1!', salt);
    const mockUser = {
      _id: '2',
      id: '2',
      username: 'logindj',
      email: 'logindj@example.com',
      password: hashedPassword,
      displayName: 'Login DJ',
      role: 'dj',
      streamKey: 'streamkey456',
      avatarUrl: '',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    MockUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'logindj@example.com',
      password: 'CorrectPass1!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 401 for wrong password', async () => {
    const salt = await bcrypt.genSalt(1);
    const hashedPassword = await bcrypt.hash('CorrectPass1!', salt);
    const mockUser = {
      _id: '2',
      username: 'logindj',
      email: 'logindj@example.com',
      password: hashedPassword,
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    MockUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'logindj@example.com',
      password: 'WrongPass1!',
    });

    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    MockUser.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'AnyPass1!',
    });

    expect(res.status).toBe(401);
  });

  it('should return 400 for missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });
});

