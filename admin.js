require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', email);
    } else {
      await Admin.create({ email, password: await bcrypt.hash(password, 10) });
      console.log('Admin created:', email);
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
