import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { LegacyUserEntity } from './legacy-user.entity';

@Injectable()
export class LegacyUserService {
  constructor(
    @InjectRepository(LegacyUserEntity)
    private legacyUserRepository: Repository<LegacyUserEntity>,
  ) {}

  findAll() {
    return this.legacyUserRepository.find();
  }

  findOneByUsername(username: string) {
    return this.legacyUserRepository.findOne({ where: { uid: username } });
  }

  update(
    user: LegacyUserEntity,
    firstname: string,
    lastname: string,
    email: string,
  ) {
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;

    return this.legacyUserRepository.save(user);
  }

  updatePassword(user: LegacyUserEntity, password: string) {
    user.pwd = createHash('sha1').update(password).digest('hex');
    return this.legacyUserRepository.save(user);
  }

  remove(username: string) {
    return this.legacyUserRepository.delete({ uid: username });
  }
}
