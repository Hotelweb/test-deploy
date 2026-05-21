import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV', 'development') === 'production';
        const synchronize =
          configService
            .get<string>('DB_SYNCHRONIZE', isProduction ? 'false' : 'true')
            .toLowerCase() !== 'false';

        const databaseUrl = configService.get<string>('DATABASE_URL');
        const ssl =
          configService.get<string>('DB_SSL', 'false').toLowerCase() === 'true';

        // If DATABASE_URL is provided (e.g. on Vercel with Render Postgres),
        // use it directly. Otherwise fall back to individual DB_* vars.
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize,
            ssl: ssl ? { rejectUnauthorized: false } : false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'a25_db'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize,
          ssl: ssl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
