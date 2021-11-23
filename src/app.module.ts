import { join } from 'path';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';
import { UsersModule } from './user/users.module';
import { CertificateModule } from './certificate/certificate.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationController } from './user/authentication/authentication.controller';
import { LegacyUserService } from './user/legacy-user.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    /* config is stored in orgmconfig.json */
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions(), {
          autoLoadEntities: true,
        }),
    }),
    ThrottlerModule.forRoot({
      // allow up to 'limit' requests every 'ttl' seconds
      ttl: 60,
      limit: 5,
    }),
    ConfigModule.forRoot(),
    UsersModule,
    CertificateModule,
    GraphQLModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        debug: false,
        playground: false,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        cors: {
          origin: configService.get('FRONTEND_URL'),
          methods: ['POST', 'OPTIONS'],
          allowedHeaders: [
            /* nginx headers don't have to be included here, this is just for the browser to know */
            'Authorization',
            'Content-Type',
            'Accept',
            'Origin',
            'User-Agent',
            'Cache-Control',
            'Keep-Alive',
            'If-Modified-Since',
          ],
          // disable cookies
          credentials: false,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthenticationController],
  providers: [LegacyUserService],
})
export class AppModule {}
