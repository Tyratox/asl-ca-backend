import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/user/users.module';
import { CertificateEntity } from './certificate.entity';
import { CertificateResolver } from './certificate.resolver';
import { CertificateService } from './certificate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificateEntity]),
    forwardRef(() => UsersModule),
    ConfigModule,
  ],
  exports: [TypeOrmModule, CertificateService],
  providers: [CertificateService, CertificateResolver],
})
export class CertificateModule {}
