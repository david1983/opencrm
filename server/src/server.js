import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import app from './app.js';
import uploadWorker from './workers/uploadWorker.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start services
connectDB().then(() => {
  // Start the upload worker
  uploadWorker.start();
});

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  uploadWorker.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  uploadWorker.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;