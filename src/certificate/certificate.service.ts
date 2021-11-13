import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { execFileSync, execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { LegacyUserEntity } from '../user/legacy-user.entity';
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

  async generateCertificateForUser(
    user: LegacyUserEntity,
    name: string,
    password: string,
  ) {
    let certificate = this.certificateRepository.create({
      name,
      is_revoked: false,
      user,
    });

    certificate = await this.certificateRepository.save(certificate);
    const certificateId = certificate.id.toString();

    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CA_UTIL_PATH = join(CA_PATH, 'ca-utility');

    const TEMP_PATH_CRT = join(CA_PATH, 'tmp', certificateId + '.crt');
    const TEMP_PATH_KEY = join(CA_PATH, 'tmp', certificateId + '.key');
    const TEMP_PATH_P12 = join(CA_PATH, 'tmp', certificateId + '.p12');

    // IMPORTANT: DON'T ENABLE THE SHELL OPTION, WE HAVE USER CONTROLLED INPUT
    const keyFileInBase64 = execFileSync(
      CA_UTIL_PATH,
      ['generate', certificateId],
      {
        encoding: 'base64',
        stdio: 'pipe',
      },
    );
    execFileSync(CA_UTIL_PATH, ['request', certificateId, user.email], {
      stdio: 'pipe',
    });
    const certFileInBase64 = execFileSync(
      CA_UTIL_PATH,
      ['sign', certificateId],
      { encoding: 'base64', stdio: 'pipe' },
    );
    // write to tmp directory, we have it in memory anyway so it's probably okay
    // to write it to a directory for generating the p12 file
    writeFileSync(TEMP_PATH_KEY, keyFileInBase64, {
      encoding: 'base64',
    });
    writeFileSync(TEMP_PATH_CRT, certFileInBase64, {
      encoding: 'base64',
    });

    execFileSync(
      'openssl',
      [
        'pkcs12',
        '-export',
        '-in',
        TEMP_PATH_CRT,
        '-inkey',
        TEMP_PATH_KEY,
        '-out',
        TEMP_PATH_P12,
        '-passout',
        /* empty password */
        `pass:${password}`,
      ],
      { stdio: 'pipe' },
    );
    // read p12 file
    const p12 = readFileSync(TEMP_PATH_P12, { encoding: 'base64' });
    // delete the key, cert and p12 file
    unlinkSync(TEMP_PATH_KEY);
    unlinkSync(TEMP_PATH_CRT);
    unlinkSync(TEMP_PATH_P12);

    return { certificate, p12 };
  }

  getCertificateRevocationList() {
    const CA_PATH = this.configService.get<string>('CA_PATH');
    const CRL_PATH = join(CA_PATH, 'crl', 'revoked.pem');

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
