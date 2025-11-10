const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const migrateNames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const users = await User.find({});
    console.log(`Found ${users.length} users to check`);

    let migrated = 0;

    for (const user of users) {
      // If fullName exists but split fields don't
      if (user.fullName && (!user.firstName || !user.lastName)) {
        const nameParts = user.fullName.trim().split(' ');
        
        if (nameParts.length === 1) {
          user.firstName = nameParts[0];
          user.lastName = nameParts[0];
        } else if (nameParts.length === 2) {
          user.firstName = nameParts[0];
          user.lastName = nameParts[1];
        } else if (nameParts.length >= 3) {
          user.firstName = nameParts[0];
          user.middleName = nameParts.slice(1, -1).join(' ');
          user.lastName = nameParts[nameParts.length - 1];
        }

        // Save without triggering password hash
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              firstName: user.firstName,
              middleName: user.middleName || '',
              lastName: user.lastName
            }
          }
        );

        console.log(`✅ Migrated: ${user.email} → ${user.firstName} ${user.middleName} ${user.lastName}`);
        migrated++;
      } else if (user.firstName && user.lastName) {
        console.log(`✓ Already migrated: ${user.email}`);
      }
    }

    console.log(`\n✅ Migration complete! Migrated ${migrated} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateNames();