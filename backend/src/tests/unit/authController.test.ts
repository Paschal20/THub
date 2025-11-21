import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { signUp, loginUser } from '../../controllers/authController';
import { userModel } from '../../models/userModel';
import argon2 from 'argon2';

// Mock generateToken function
jest.mock('../../utils/generate', () => ({
  generateToken: jest.fn(() => 'mockedToken'),
}));

const app = express();
app.use(express.json());
app.post('/signup', signUp);
app.post('/login', loginUser); // Add login route for testing

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await userModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('signUp - Input Validation', () => {
  it('should return 201 and create a user with valid data', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual('User created successfully');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(userData.email);

    const userInDb = await userModel.findOne({ email: userData.email });
    expect(userInDb).toBeDefined();
    expect(await argon2.verify(userInDb!.password, userData.password)).toBe(true);
  });

  it('should return 400 if full name is missing', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Full name is required');
  });

  it('should return 400 if email is missing', async () => {
    const userData = {
      fullName: 'Test User',
      password: 'Password1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Email is required');
  });

  it('should return 400 if password is missing', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password is required');
  });

  it('should return 400 if email format is invalid', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'invalid-email',
      password: 'Password1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Email must be a valid email address');
  });

  it('should return 400 if password is too short', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Pass1!',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password should have a minimum length of 8');
  });

  it('should return 400 if password lacks uppercase', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 if password lacks lowercase', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'PASSWORD1!23',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 if password lacks number', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password!!',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 if password lacks special character', async () => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
    };

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 if user already exists', async () => {
    const userData = {
      fullName: 'Existing User',
      email: 'existing@example.com',
      password: 'Password1!23',
    };

    await userModel.create({
      fullName: userData.fullName,
      email: userData.email,
      password: await argon2.hash(userData.password),
      isEmailVerified: true,
    });

    const res = await request(app).post('/signup').send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('User already exists');
  });
});

describe('loginUser - Input Validation', () => {
  const validUser = {
    fullName: 'Login User',
    email: 'login@example.com',
    password: 'LoginPassword1!23',
  };

  beforeEach(async () => {
    await userModel.create({
      fullName: validUser.fullName,
      email: validUser.email,
      password: await argon2.hash(validUser.password),
      isEmailVerified: true,
    });
  });

  it('should return 200 and login user with valid credentials', async () => {
    const res = await request(app).post('/login').send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Login successful');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(validUser.email);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/login').send({
      password: validUser.password,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Email is required');
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app).post('/login').send({
      email: validUser.email,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password is required');
  });

  it('should return 400 if email format is invalid', async () => {
    const res = await request(app).post('/login').send({
      email: 'invalid-email',
      password: validUser.password,
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Email must be a valid email address');
  });

  it('should return 404 if user not found', async () => {
    const res = await request(app).post('/login').send({
      email: 'nonexistent@example.com',
      password: validUser.password,
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('User not found');
  });

  it('should return 400 if invalid password', async () => {
    const res = await request(app).post('/login').send({
      email: validUser.email,
      password: 'WrongPassword1!23',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Invalid email or password');
  });
});
