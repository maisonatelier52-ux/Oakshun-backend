// Script to update existing users with null name values
// Run this once after adding the name column
// You can execute this via: npx ts-node src/scripts/update-existing-users.ts

import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateExistingUsers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'superUser',
    database: process.env.DB_NAME || 'MyDB',
    entities: [User],
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(User);
    const usersWithoutName = await userRepository.find({
      where: { name: null as any },
    });

    if (usersWithoutName.length === 0) {
      console.log('No users with null name found');
      return;
    }

    console.log(`Found ${usersWithoutName.length} users without name`);

    for (const user of usersWithoutName) {
      // Extract name from email (before @) or use a default
      const defaultName = user.email.split('@')[0] || 'User';
      user.name = defaultName;
      await userRepository.save(user);
      console.log(`Updated user ${user.email} with name: ${defaultName}`);
    }

    console.log('All users updated successfully');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateExistingUsers();
