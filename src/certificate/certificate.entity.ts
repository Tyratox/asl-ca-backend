import { LegacyUserEntity } from 'src/user/legacy-user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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

  @ManyToOne((type) => LegacyUserEntity, (user) => user.certificates, {
    onDelete: 'CASCADE',
  })
  user: LegacyUserEntity;
}
