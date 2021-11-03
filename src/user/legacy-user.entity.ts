import { CertificateEntity } from '../certificate/certificate.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { SessionEntity } from './session.entity';

@Entity({ name: 'users' })
export class LegacyUserEntity {
  @Column({ primary: true, length: 64, nullable: false, default: '' })
  uid: string;

  @Column({ length: 64, nullable: false, default: '' })
  lastname: string;

  @Column({ length: 64, nullable: false, default: '' })
  firstname: string;

  @Column({ length: 64, nullable: false, default: '' })
  email: string;

  @Column({ length: 64, nullable: false, default: '' })
  pwd: string;

  @OneToMany((type) => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];

  @OneToMany((type) => CertificateEntity, (certificate) => certificate.user, {
    eager: true,
  })
  certificates: CertificateEntity[];
}
