import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Post from '../posts/post.entity';
import Address from '../users/address.entity';
import User from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [Post, User, Address],
      ssl: JSON.parse(process.env.USE_SSL),
      synchronize: JSON.parse(process.env.SYNC_DB),
      logging: true,
      migrations: ['./../../../../../dist/apps/api/migration/*.js'],
      cli: {
        migrationsDir: 'migration',
      },
    }),
  ],
})
export class DatabaseModule {}
