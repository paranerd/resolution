const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/user');
const app = require('../app');

// Connect to MongoDB
require('./config/database').connect();

const username = 'admin';
const password = 'password';
let refreshToken;

beforeAll(async () => {
  // Remove data from user collection
  await User.deleteMany({});
});

afterAll(async () => {
  // Disconnect from DB
  mongoose.connection.close();
});

describe('User routes', () => {
  it('Should show error for password missmatch on setup', async () => {
    const res = await request(app).post('/api/user/setup').send({
      username,
      password1: password,
      password2: 'wrong-password',
    });

    expect(res.statusCode).toEqual(400);
  });

  it('Should create admin user', async () => {
    const res = await request(app).post('/api/user/setup').send({
      username,
      password1: password,
      password2: password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('Should not allow creating another admin user', async () => {
    const res = await request(app).post('/api/user/setup').send({
      username,
      password1: password,
      password2: password,
    });

    expect(res.statusCode).toEqual(403);
  });

  it('Should not allow login with wrong credentials', async () => {
    const res = await request(app).post('/api/user/login').send({
      username,
      password: 'wrong-password',
    });

    expect(res.statusCode).toEqual(403);
  });

  it('Should return token and refresh token on successful login', async () => {
    const res = await request(app).post('/api/user/login').send({
      username,
      password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');

    refreshToken = res.body.refreshToken;
  });

  it('Should remove refreshToken from db on logout', async () => {
    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.statusCode).toEqual(200);

    const user = await User.findOne({ username });
    expect(user).toHaveProperty('refreshToken');
    expect(user.refreshToken).toHaveLength(0);
  });
});
