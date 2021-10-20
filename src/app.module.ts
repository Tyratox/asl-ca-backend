import { join } from 'path';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';
import { UsersModule } from './user/users.module';
import { CertificateModule } from './certificate/certificate.module';

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
    UsersModule,
    CertificateModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
