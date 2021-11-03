import { LegacyUserEntity } from '../user/legacy-user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'certificates' })
export class CertificateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ nullable: false })
  is_revoked: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 64, nullable: false, default: '' })
  userUid: string;

  @ManyToOne((type) => LegacyUserEntity, (user) => user.certificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUid' })
  user: LegacyUserEntity;
}
