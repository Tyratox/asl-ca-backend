import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegacyUserService } from './legacy-user.service';
import { LegacyUserEntity } from './legacy-user.entity';
import { UsersResolver } from './users.resolver';
import { AuthenticationService } from './authentication/authentication.service';
import { SessionEntity } from './session.entity';
import { CertificateModule } from '../certificate/certificate.module';
import { AuthenticationController } from './authentication/authentication.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegacyUserEntity]),
    TypeOrmModule.forFeature([SessionEntity]),
    forwardRef(() => CertificateModule),
  ],
  exports: [TypeOrmModule, AuthenticationService, AuthenticationController],
  providers: [
    LegacyUserService,
    AuthenticationService,
    UsersResolver,
    AuthenticationController,
    ConfigService,
  ],
  controllers: [],
})
export class UsersModule {}
