import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { LegacyUserEntity } from './legacy-user.entity';

@Entity({ name: 'sessions' })
export class SessionEntity {
  @Column({ primary: true, length: 255, nullable: false, default: '' })
  session_id: string;

  @ManyToOne((type) => LegacyUserEntity, (user) => user.sessions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: LegacyUserEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
