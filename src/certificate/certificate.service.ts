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
import { Like, Repository } from 'typeorm';
import { CertificateEntity } from './certificate.entity';

import * as AsyncLock from 'async-lock';
import { Int } from '@nestjs/graphql';

@Injectable()
export class CertificateService {
  lock: AsyncLock;

  constructor(
    @InjectRepository(CertificateEntity)
    private certificateRepository: Repository<CertificateEntity>,
    private configService: ConfigService,
  ) {
    this.lock = new AsyncLock();
  }

  async serialNumber() {
    const count = await this.certificateRepository.count();
    return (count + 1).toString(16).padStart(2, '0');
  }

  countAll() {
    return this.certificateRepository.count();
  }

  countAllRevoked() {
    return this.certificateRepository.count({
      where: {
        is_revoked: true,
      },
    });
  }

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
    return this.lock.acquire('generateCertificateForUser', async () => {
      let certificate = this.certificateRepository.create({
        name,
        is_revoked: false,
        user,
      });

      console.log(
        Date() +
          ' Generating certificate for user : ' +
          user.uid +
          ', with certificate name : ' +
          name,
      );

      certificate = await this.certificateRepository.save(certificate);
      const certificateId = certificate.id.toString();

      const CA_PATH = this.configService.get<string>('CA_PATH');
      const TEMP_PATH = this.configService.get<string>('TMP_PATH');
      const CA_UTIL_PATH = join(CA_PATH, 'ca-utility');

      const TEMP_PATH_CRT = join(TEMP_PATH, certificateId + '.crt');
      const TEMP_PATH_KEY = join(TEMP_PATH, certificateId + '.key');
      const TEMP_PATH_P12 = join(TEMP_PATH, certificateId + '.p12');

      // IMPORTANT: DON'T ENABLE THE SHELL OPTION, WE HAVE USER CONTROLLED INPUT

      console.log(
        Date() + ' Calling : ' + CA_UTIL_PATH + ' generate ' + certificateId,
      );
      const keyFile = execFileSync(CA_UTIL_PATH, ['generate', certificateId], {
        encoding: 'utf-8',
      });
      console.log(
        Date() +
          ' Calling : ' +
          CA_UTIL_PATH +
          ' request ' +
          certificateId +
          ' email' +
          user.uid,
      );

      execFileSync(
        CA_UTIL_PATH,
        ['request', certificateId, user.email, user.uid],
        {},
      );
      console.log(
        Date() + ' Calling : ' + CA_UTIL_PATH + ' sign ' + certificateId,
      );

      const certFile = execFileSync(CA_UTIL_PATH, ['sign', certificateId], {
        encoding: 'utf-8',
      });
      // write to tmp directory, we have it in memory anyway so it's probably okay
      // to write it to a directory for generating the p12 file
      writeFileSync(TEMP_PATH_KEY, keyFile, {
        encoding: 'utf-8',
      });
      writeFileSync(TEMP_PATH_CRT, certFile, {
        encoding: 'utf-8',
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
        {},
      );
      // read p12 file
      const p12 = readFileSync(TEMP_PATH_P12, { encoding: 'base64' });
      // delete the key, cert and p12 file
      unlinkSync(TEMP_PATH_KEY);
      unlinkSync(TEMP_PATH_CRT);
      unlinkSync(TEMP_PATH_P12);

      return { certificate, p12 };
    });
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
    return this.lock.acquire('revokeCertificate', () => {
      const CA_PATH = this.configService.get<string>('CA_PATH');
      const CA_UTIL_PATH = join(CA_PATH, 'ca-utility');
      const certificateId = certificate.id.toString();

      execFileSync(CA_UTIL_PATH, ['revoke', certificateId], {});
      execFileSync(CA_UTIL_PATH, ['update-crl'], {});

      // if system calls succeeded, also store in database
      certificate.is_revoked = true;

      return this.certificateRepository.save(certificate);
    });
  }
}
