/* global intern */

import mongoose from 'mongoose';

intern.on('runStart', async () => {
  console.info('Connecting to db...');
  await mongoose.connect('mongodb://localhost/authctest');
  console.info('Successfully connected to db.');
});

intern.on('runEnd', async () => {
  console.info('Closing connection to db...');
  await mongoose.connection.close();
  console.info('Successfully closed connection to db.');
});