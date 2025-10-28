const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const activateAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Update all users to set isActive = true
    const result = await User.updateMany(
      { $or: [{ isActive: { $exists: false } }, { isActive: false }] },
      { $set: { isActive: true } }
    );

    console.log(`✅ Activated ${result.modifiedCount} users`);
    
    // Show all users
    const users = await User.find({}).select('email role isActive');
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}): ${user.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

activateAllUsers();