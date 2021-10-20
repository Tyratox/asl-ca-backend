import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LegacyUserEntity } from 'src/user/legacy-user.entity';
import { Repository } from 'typeorm';
import { CertificateEntity } from './certificate.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(CertificateEntity)
    private certificateRepository: Repository<CertificateEntity>,
  ) {}

  findAll() {
    return this.certificateRepository.find();
  }

  findByUser(user: LegacyUserEntity) {
    return this.certificateRepository.find({ where: { user } });
  }

  findOneById(id: number) {
    return this.certificateRepository.findOne({ where: { id } });
  }

  findOneByIdAndUser(id: number, user: LegacyUserEntity) {
    return this.certificateRepository.findOne({ where: { id, user } });
  }

  async generateCertificateForUser(user: LegacyUserEntity, name: string) {
    const certificate = this.certificateRepository.create({
      name,
      is_revoked: false,
      user,
    });

    return this.certificateRepository.save(certificate);
  }

  revokeCertificate(certificate: CertificateEntity) {
    certificate.is_revoked = true;

    return this.certificateRepository.save(certificate);
  }
}
