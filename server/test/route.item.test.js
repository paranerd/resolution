// Read ENV variables
require('dotenv').config();

// Set media directory to test files
process.env.MEDIA_DIR = './test/media';
process.env.UPLOAD_DIR = './test/media/upload';

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Item = require('../models/item');
const app = require('../app');

// Connect to MongoDB
require('../util/database').connect();

const username = 'admin';
const password = 'password';
const testfileDir = './test/testfiles';
let token;
let item;

beforeAll(async () => {
  // Remove data from user collection
  await User.deleteMany({});

  // Remove data from item collection
  await Item.deleteMany({});

  // Create admin user
  const user = await new User({
    username,
    password: await User.hashPassword(password),
    isAdmin: true,
  });

  // Save user
  await user.save();
});

afterAll(async () => {
  // Remove media and upload directory
  if (fs.existsSync(process.env.MEDIA_DIR)) {
    fs.rmSync(process.env.MEDIA_DIR, { recursive: true, force: true });
  }

  // Disconnect from DB
  mongoose.connection.close();
});

describe('Item routes', () => {
  // Create media and upload directory
  // Doing this in beforeAll didn't finish before entering describe.
  if (!fs.existsSync(process.env.UPLOAD_DIR)) {
    fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
  } else {
    fs.rmSync(process.env.MEDIA_DIR, { recursive: true, force: true });
    fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
  }

  // Copy one testfile to upload folder
  const source = path.join(testfileDir, 'test-1.jpg');
  const mediaDest = path.join(process.env.MEDIA_DIR, 'test-2.jpg');
  const uploadDest = path.join(process.env.UPLOAD_DIR, 'test-2.jpg');

  fs.copyFileSync(source, mediaDest);
  fs.copyFileSync(source, uploadDest);

  it('Should return token on successful login', async () => {
    const res = await request(app).post('/api/user/login').send({
      username,
      password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');

    token = res.body.token;
  });

  it('Should return an empty items array', async () => {
    const res = await request(app)
      .get('/api/item')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toHaveLength(0);
  });

  it('Should confirm 2 imported items', async () => {
    const res = await request(app)
      .post('/api/item/scan')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('msg');
    expect(res.body.msg).toEqual(2);
  });

  it('Should confirm 3 uploaded files', async () => {
    const res = await request(app)
      .post('/api/item/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', path.join(testfileDir, 'test-1.jpg'))
      .attach('files', path.join(testfileDir, 'test-2.jpg'))
      .attach('files', path.join(testfileDir, 'test-3.jpg'))
      .attach('files', path.join(testfileDir, 'test-4.jpg'));

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toHaveLength(3);

    const testFile4Path = path.join(process.env.UPLOAD_DIR, 'test-4.jpg');

    expect(fs.existsSync(testFile4Path)).toBe(true);
  });

  it('Should confirm 5 imported items', async () => {
    const res = await request(app)
      .post('/api/item/scan')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('msg');
    expect(res.body.msg).toEqual(5);
  });

  it('Should return no additional imported items', async () => {
    const res = await request(app)
      .post('/api/item/scan')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('msg');
    expect(res.body.msg).toEqual(5);
  });

  it('Should return 5 items', async () => {
    const res = await request(app)
      .get('/api/item')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toHaveLength(5);

    // Get test-1.jpg item
    item = res.body.items.find((el) => el.width === 416 && el.height === 521);
  });

  it('Should contain all required properties', async () => {
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('height');
    expect(item).toHaveProperty('width');
  });

  it('Should have correct width and height', async () => {
    expect(item.width).toEqual(416);
    expect(item.height).toEqual(521);
  });

  it('Should return a Buffer', async () => {
    const res = await request(app)
      .get(`/api/item/${item.id}?w=208&h=260`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Buffer);
  });

  it('Should download the correct file', async () => {
    const res = await request(app)
      .get(`/api/item/download?ids=${item.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-disposition']).toMatch(/filename="test-1.jpg"/);
    expect(res.body).toBeInstanceOf(Buffer);
  });

  it('Should remove the item', async () => {
    const res = await request(app)
      .delete(`/api/item`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ids: [item.id],
      });

    expect(res.statusCode).toEqual(200);

    const testFile1Path = path.join(process.env.MEDIA_DIR, 'test-1.jpg');

    expect(fs.existsSync(testFile1Path)).toBe(false);
  });
});
