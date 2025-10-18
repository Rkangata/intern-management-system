const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Create Super Admin (who can create HR and HOD users)
    const adminExists = await User.findOne({ email: 'admin@ims.com' });
    if (!adminExists) {
      await User.create({
        fullName: 'System Administrator',
        email: 'admin@ims.com',
        password: 'admin123456',
        phoneNumber: '+254700000000',
        role: 'admin',
      });
      console.log('✅ Super Admin created: admin@ims.com / admin123456');
    } else {
      console.log('ℹ️ Super Admin already exists');
    }

    console.log('\n🎉 Super Admin user ready!');
    console.log('\nLogin Credentials:');
    console.log('═══════════════════════════════════');
    console.log('Super Admin:');
    console.log('  Email: admin@ims.com');
    console.log('  Password: admin123456');
    console.log('═══════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedAdminUsers();
