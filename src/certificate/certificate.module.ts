import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationService } from 'src/user/authentication/authentication.service';
import { UsersModule } from 'src/user/users.module';
import { CertificateEntity } from './certificate.entity';
import { CertificateResolver } from './certificate.resolver';
import { CertificateService } from './certificate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificateEntity]),
    forwardRef(() => UsersModule),
  ],
  exports: [TypeOrmModule, CertificateService],
  providers: [CertificateService, CertificateResolver],
})
export class CertificateModule {}
