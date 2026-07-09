import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  const mongoUri = isProd
    ? 'mongodb+srv://oakshun:oakshun123@cluster0.kvlibgx.mongodb.net/?appName=Cluster0'
    : 'mongodb://localhost:27017/oakshun_db';

  return {
    uri: mongoUri,
  };
};
