import '../src/config.js';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../src/models/user.js';
import connect from '../src/util/database.js';
import app from '../src/app.js';

// Connect to MongoDB
connect();

const username = 'admin';
const password = 'password';
let refreshToken: string;
let refreshTokenAdmin: string;

beforeAll(async () => {
  // Remove data from user collection
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  // Disconnect from DB
  mongoose.connection.close();
});

describe('Auth routes', () => {
  describe('setup', () => {
    it('Should show error for password missmatch on setup', async () => {
      const res = await request(app).post('/api/auth/setup').send({
        username,
        password1: password,
        password2: 'wrong-password',
      });

      expect(res.statusCode).toEqual(400);
    });

    it('Should create admin user and return token and refresh token', async () => {
      const res = await request(app).post('/api/auth/setup').send({
        username,
        password1: password,
        password2: password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');

      refreshTokenAdmin = res.body.refreshToken;
    });

    it('Should not allow creating another admin user', async () => {
      const res = await request(app).post('/api/auth/setup').send({
        username,
        password1: password,
        password2: password,
      });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('login', () => {
    it('Should not allow login with wrong credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        username,
        password: 'wrong-password',
      });

      expect(res.statusCode).toEqual(401);
    });

    it('Should return token and refresh token on successful login', async () => {
      const res = await request(app).post('/api/auth/login').send({
        username,
        password,
      });

      const user = await User.findOne({ username });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(user?.refreshToken).toHaveLength(2);

      refreshToken = res.body.refreshToken;
    });
  });

  describe('refresh', () => {
    it('Should obtain new refresh token and delete the old one', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`);

      const user = await User.findOne({ username });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(user).not.toBeNull();
      expect(user).toHaveProperty('refreshToken');
      expect(user?.refreshToken).toHaveLength(2);

      refreshToken = res.body.refreshToken;
    });

    it('Should fail refreshing for wrong refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer invalid-token`);

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('logout', () => {
    it('Should remove refresh token from db on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(res.statusCode).toEqual(200);

      const user = await User.findOne({ username });
      expect(user).not.toBeNull();
      expect(user).toHaveProperty('refreshToken');
      expect(user?.refreshToken).toHaveLength(1);
    });

    it('Should remove admin refresh token from db on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${refreshTokenAdmin}`);

      expect(res.statusCode).toEqual(200);

      const user = await User.findOne({ username });
      expect(user).not.toBeNull();
      expect(user).toHaveProperty('refreshToken');
      expect(user?.refreshToken).toHaveLength(0);
    });
  });
});
