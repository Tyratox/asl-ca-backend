import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { LegacyUserService } from 'src/user/legacy-user.service';
import { SessionEntity } from '../session.entity';
import { LessThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LegacyUserEntity } from '../legacy-user.entity';

//according to owasp at least 128 bits = 16 bytes, so double it twice
const NUMBER_OF_RANDOM_BYTES = 64;
//milliseconds
const SESSION_TTL = 1000 * 60 * 30; // 30m

@Injectable()
export class AuthenticationService {
  constructor(
    private userService: LegacyUserService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
  ) {}

  validatePassword(user: LegacyUserEntity, password: string) {
    return user.pwd === createHash('sha1').update(password).digest('hex');
  }

  async authenticateUser(username: string, password: string) {
    const user = await this.userService.findOneByUsername(username);
    if (
      user &&
      //compute insecure sha1 hash
      this.validatePassword(user, password)
    ) {
      //delete old sessions from the database
      await this.removeOldSessions();

      //create new session
      return await this.generateSessionForUser(user);
    }
    return false;
  }

  async validateToken(token: string) {
    const session = await this.findSessionBySessionId(token);
    if (!session) {
      return false;
    }

    return session;
  }

  findAllSessions() {
    return this.sessionRepository.find();
  }

  async findSessionBySessionId(session_id: string) {
    const session = await this.sessionRepository.findOne({
      where: { session_id },
    });
    if (!session) {
      return null;
    }

    //check if session is too old
    if (Date.now() - session.created_at.getTime() > SESSION_TTL) {
      await this.removeSession(session.session_id);
      return null;
    }

    return session;
  }

  async generateSessionForUser(user: LegacyUserEntity) {
    let session_id = randomBytes(NUMBER_OF_RANDOM_BYTES).toString('base64');
    while (await this.findSessionBySessionId(session_id)) {
      //as long as there already is one with the same session id
      //generate a new one!
      session_id = randomBytes(NUMBER_OF_RANDOM_BYTES).toString('base64');
    }

    const entity = this.sessionRepository.create({ session_id, user });
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
