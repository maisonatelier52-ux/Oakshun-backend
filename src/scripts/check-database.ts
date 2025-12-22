// Script to check database connection and create tables if needed
// Run this if you're having issues with tables not being created
// Execute: npx ts-node src/scripts/check-database.ts

import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'superUser',
    database: process.env.DB_NAME || 'MyDB',
    entities: [User],
    synchronize: true, // This will create tables if they don't exist
    logging: true,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Check if users table exists
    const queryRunner = dataSource.createQueryRunner();
    const tableExists = await queryRunner.hasTable('users');
    
    if (tableExists) {
      console.log('✅ Users table exists');
      const userCount = await dataSource.getRepository(User).count();
      console.log(`📊 Total users in database: ${userCount}`);
    } else {
      console.log('⚠️  Users table does not exist. Creating...');
      await dataSource.synchronize();
      console.log('✅ Users table created');
    }

    await queryRunner.release();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code === '3D000') {
      console.error('💡 Database does not exist. Please create it first:');
      console.error(`   CREATE DATABASE ${process.env.DB_NAME || 'MyDB'};`);
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

checkDatabase();
