import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegacyUserService } from './legacy-user.service';
import { LegacyUserEntity } from './legacy-user.entity';
import { UsersResolver } from './users.resolver';
import { AuthenticationService } from './authentication/authentication.service';
import { AdministratorService } from './administrator.service';
import { SessionEntity } from './session.entity';
import { CertificateModule } from '../certificate/certificate.module';
import { AuthenticationController } from './authentication/authentication.controller';
import { ConfigService } from '@nestjs/config';
import { AdministratorEntity } from './administrator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegacyUserEntity]),
    TypeOrmModule.forFeature([SessionEntity]),
    TypeOrmModule.forFeature([AdministratorEntity]),
    forwardRef(() => CertificateModule),
  ],
  exports: [TypeOrmModule, AuthenticationService, AuthenticationController],
  providers: [
    AdministratorService,
    LegacyUserService,
    AuthenticationService,
    UsersResolver,
    AuthenticationController,
    ConfigService,
  ],
  controllers: [],
})
export class UsersModule {}
