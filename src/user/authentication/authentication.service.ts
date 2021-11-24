import { createHash, pbkdf2Sync, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { LegacyUserService } from '../../user/legacy-user.service';
import { SessionEntity } from '../session.entity';
import { LessThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LegacyUserEntity } from '../legacy-user.entity';

//according to owasp at least 128 bits = 16 bytes, so double it twice
const SESSION_RANDOM_BYTES = 64;
const SESSION_LENGTH = Math.ceil((SESSION_RANDOM_BYTES * 8) / 6);
//milliseconds
const SESSION_TTL = 1000 * 60 * 30; // 30m

const HASH_ITERATIONS = 10000;
const HASH_SALT_BYTES = 64;
const HASH_BYTES = 64;
const HASH_DIGEST = 'sha512';

@Injectable()
export class AuthenticationService {
  constructor(
    private userService: LegacyUserService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
  ) {}

  hash(value: string, salt: string) {
    return pbkdf2Sync(
      value,
      salt,
      HASH_ITERATIONS,
      HASH_BYTES,
      HASH_DIGEST,
    ).toString('base64');
  }

  computeSaltedHash(value: string) {
    const salt = randomBytes(HASH_SALT_BYTES).toString('base64');
    const hash = this.hash(value, salt);

    //salt: 64 bytes => 512 bits => 86 characters
    //hash: 64 bytes => 512 bits => 86 characters
    return `${salt}:${hash}`;
  }

  verifySaltedHash(value: string, salted_hash: string) {
    const [salt, hash] = salted_hash.split(':');

    return this.hash(value, salt) == hash;
  }

  validatePassword(user: LegacyUserEntity, password: string) {
    return user.pwd === createHash('sha1').update(password).digest('hex');
  }

  async authenticateUser(
    username: string,
    password: string,
    ip_address: string,
  ) {
    const user = await this.userService.findOneByUsername(username);
    if (
      user &&
      //compute insecure sha1 hash
      this.validatePassword(user, password)
    ) {
      //delete old sessions from the database
      await this.removeOldSessions();

      //create new session
      return await this.generateSessionForUser(user, ip_address);
    }
    return false;
  }

  async validateToken(token: string, ip_address: string) {
    const session = await this.findSession(token, ip_address);
    if (!session) {
      return false;
    }

    return session;
  }

  findAllSessions() {
    return this.sessionRepository.find();
  }

  async findSession(session_id: string, ip_address: string) {
    const session = await this.sessionRepository.findOne({
      /* pad session_id s.t. timing attacks are not possible */
      where: { session_id: session_id.padEnd(SESSION_LENGTH, '0') },
    });

    if (!session || !this.verifySaltedHash(ip_address, session.ip_address)) {
      return null;
    }

    //check if session is too old
    if (Date.now() - session.created_at.getTime() > SESSION_TTL) {
      await this.removeSession(session.session_id);
      return null;
    }

    return session;
  }

  async generateSessionForUser(user: LegacyUserEntity, ip_address: string) {
    let session_id = randomBytes(SESSION_RANDOM_BYTES).toString('base64');

    while (await this.findSession(session_id, ip_address)) {
      //as long as there already is one with the same session id
      //generate a new one!
      session_id = randomBytes(SESSION_RANDOM_BYTES).toString('base64');
    }

    const entity = this.sessionRepository.create({
      session_id: session_id.padEnd(SESSION_LENGTH, '0'),
      user,
      ip_address: this.computeSaltedHash(ip_address),
    });
    await this.sessionRepository.save(entity);

    return entity;
  }

  removeSession(session_id: string) {
    return this.sessionRepository.delete({ session_id });
  }

  removeSessionsByUser(user: LegacyUserEntity) {
    return this.sessionRepository.delete({ user });
  }

  removeSessionsByUserExcept(
    user: LegacyUserEntity,
    session_id_to_persist: string,
  ) {
    return this.sessionRepository.delete({
      user,
      session_id: Not(session_id_to_persist),
    });
  }

  removeOldSessions() {
    //Date.now() - session.created_at.getTime() > SESSION_TTL
    //Date.now() - SESSION_TTL > session.created_at.getTime()
    const d = new Date(Date.now() - SESSION_TTL);
    return this.sessionRepository.delete({ created_at: LessThan(d) });
  }
}
