import { LegacyUserEntity } from './legacy-user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'administrators' })
export class AdministratorEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64, nullable: false, default: '', unique: true })
  userUid: string;

  @OneToOne((type) => LegacyUserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userUid' })
  user: LegacyUserEntity;
}
