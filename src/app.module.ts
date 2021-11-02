import { join } from 'path';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';
import { UsersModule } from './user/users.module';
import { CertificateModule } from './certificate/certificate.module';
import { ConfigModule } from '@nestjs/config';
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
    GraphQLModule.forRoot({
      debug: true,
      playground: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    ConfigModule.forRoot(),
    UsersModule,
    CertificateModule,
  ],
  controllers: [AuthenticationController],
  providers: [LegacyUserService],
})
export class AppModule {}
