const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/deploymate-test');
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
  });

  describe('GET /api/auth/me', () => {
    it('should return user data when authenticated', async () => {
      // Create test user
      const user = new User({
        githubId: '12345',
        githubUsername: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      });
      await user.save();

      // Generate test token (simplified for testing)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.githubUsername).toBe('testuser');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('POST /api/auth/profile', () => {
    it('should update user profile', async () => {
      // Create test user
      const user = new User({
        githubId: '12345',
        githubUsername: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      });
      await user.save();

      // Generate test token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });
  });

  describe('GET /api/auth/subscription', () => {
    it('should return subscription info', async () => {
      // Create test user
      const user = new User({
        githubId: '12345',
        githubUsername: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'starter',
        deploymentLimit: 50,
        buildMinutesLimit: 1000,
      });
      await user.save();

      // Generate test token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/subscription')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tier).toBe('starter');
      expect(response.body.data.limits.deployments.limit).toBe(50);
    });
  });
});

