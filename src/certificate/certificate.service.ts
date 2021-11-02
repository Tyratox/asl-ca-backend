import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { execFileSync, execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LegacyUserEntity } from 'src/user/legacy-user.entity';
import { Repository } from 'typeorm';
import { CertificateEntity } from './certificate.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(CertificateEntity)
    private certificateRepository: Repository<CertificateEntity>,
    private configService: ConfigService,
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
    let certificate = this.certificateRepository.create({
      name,
      is_revoked: false,
      user,
    });

    certificate = await this.certificateRepository.save(certificate);
    const certificateId = certificate.id.toString();

    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CA_UTIL_PATH = join(CA_PATH, 'ca-utility');
    const CERT_PATH = join(CA_PATH, 'newcerts', certificateId.padStart(2, '0'));

    // IMPORTANT: DON'T ENABLE THE SHELL OPTION, WE HAVE USER CONTROLLED INPUT
    const keyFileInBase64 = execFileSync(
      CA_UTIL_PATH,
      ['generate', certificateId],
      {
        encoding: 'base64',
      },
    );
    execFileSync(CA_UTIL_PATH, ['request', certificateId, user.email]);
    execFileSync(CA_UTIL_PATH, ['sign', certificateId]);

    return { certificate, privateKey: keyFileInBase64 };
  }

  getCertificateFile(certificate: CertificateEntity) {
    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CERT_PATH = join(
      CA_PATH,
      'newcerts',
      certificate.id.toString().padStart(2, '0') + '.pem',
    );

    // the directory newcerts is readable by us
    return readFileSync(CERT_PATH, {
      encoding: 'base64',
    });
  }

  getCertificateRevocationList() {
    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CRL_PATH = join(CA_PATH, 'crl', 'crl.pem');

    try {
      const content = readFileSync(CRL_PATH, {
        encoding: 'base64',
      });
      return content;
    } catch (e) {
      // if the file doesn't exist yet, return an empty string
      return '';
    }
  }

  async revokeCertificate(certificate: CertificateEntity) {
    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CA_UTIL_PATH = join(CA_PATH, 'ca-utility');
    const certificateId = certificate.id.toString();

    execFileSync(CA_UTIL_PATH, ['revoke', certificateId]);
    execFileSync(CA_UTIL_PATH, ['update-crl']);

    // if system calls succeeded, also store in database
    certificate.is_revoked = true;

    return this.certificateRepository.save(certificate);
  }
}
