import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true },
  role: { type: String, default: 'buyer', enum: ['buyer', 'seller', 'admin'] },
  phone: String,
  avatarUrl: String,
  KYC_verified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Database connected successfully.');

    const email = 'admin@gmail.com';
    const password = 'adminlogin';

    let adminUser = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (adminUser) {
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      adminUser.name = 'Administrator';
      await adminUser.save();
      console.log(`✅ Admin user with email ${email} already existed. Updated role to 'admin' and password to 'adminlogin'.`);
    } else {
      adminUser = new User({
        email,
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator',
        KYC_verified: true,
      });
      await adminUser.save();
      console.log(`✅ Admin user with email ${email} and password 'adminlogin' created successfully!`);
    }

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
