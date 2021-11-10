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

@Module({
  imports: [
    /* config is stored in orgmconfig.json */
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions(), {
          autoLoadEntities: true,
        }),
    }),
    ConfigModule.forRoot(),
    UsersModule,
    CertificateModule,
    GraphQLModule.forRootAsync({
      imports: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        debug: true,
        playground: true,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        cors: {
          origin: configService.get('FRONTEND_URL'),
          methods: ['POST'],
          allowedHeaders: [
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
