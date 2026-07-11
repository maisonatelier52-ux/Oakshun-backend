import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'oakshun_db',
    entities: [User],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected successfully.');

    const userRepository = dataSource.getRepository(User);
    const email = 'admin@gmail.com';
    const password = 'adminlogin';

    let adminUser = await userRepository.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (adminUser) {
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      adminUser.name = 'Administrator';
      await userRepository.save(adminUser);
      console.log(`✅ Admin user with email ${email} already existed. Updated role to 'admin' and password to 'admin'.`);
    } else {
      adminUser = userRepository.create({
        email,
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator',
        KYC_verified: true,
      });
      await userRepository.save(adminUser);
      console.log(`✅ Admin user with email ${email} and password 'admin' created successfully!`);
    }

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await dataSource.destroy();
  }
}

createAdmin();
