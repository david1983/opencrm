import mongoose from 'mongoose';
import createApp from '../src/app.js';

export async function createTestApp() {
  const app = createApp;
  return app;
}

export { createTestApp };