import mongoose from 'mongoose';

export default async function globalTeardown() {
  await mongoose.disconnect();
  await global.__MONGO_SERVER__?.stop();
}