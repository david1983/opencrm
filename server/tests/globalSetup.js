import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export default async function globalSetup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.NODE_ENV = 'test';

  // Store reference for teardown
  global.__MONGO_SERVER__ = mongoServer;

  await mongoose.connect(uri);
}