import { Req, UseGuards } from '@nestjs/common';
import {
  Args,
  createUnionType,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Scalar,
} from '@nestjs/graphql';
import { GqlAuthGuard } from '../user/authentication/graphql-auth.guard';
import { AdministratorService } from './administrator.service';
import { AuthenticationService } from './authentication/authentication.service';
import { CurrentSessionId } from './authentication/current-session-id.decorator';
import { CurrentUser } from './authentication/current-user.decorator';
import { LegacyUserEntity } from './legacy-user.entity';
import { LegacyUserService } from './legacy-user.service';
import { User } from './user.model';
import {
  AuthenticationException,
  createAuthenticationException,
} from '../exceptions/authentication.exception';
import {
  createWrongPasswordException,
  WrongPasswordException,
} from '../exceptions/wrong-password.exception';
import { Session } from './session.model';
import { CertificateService } from '../certificate/certificate.service';
import { Certificate } from '../certificate/certificate.model';
import {
  createInvalidEmailException,
  InvalidEmailException,
} from '../exceptions/invalid-email.exception';
import { GraphQLException } from '../exceptions/exception.model';
import { ThrottlerBehindProxyGuard } from '../throttler-behind-proxy.guard';
import { Request } from 'express';
import { GraphQLRequest } from './graphql-request.decorator';

const AuthenticationResult = createUnionType({
  name: 'AuthenticationResult',
  types: () => [Session, AuthenticationException],
  resolveType: (value) => {
    if (value instanceof GraphQLException) {
      return AuthenticationException;
    } else {
      return Session;
    }
  },
});

const UpdateUserResult = createUnionType({
  name: 'UpdateUserResult',
  types: () => [User, InvalidEmailException],
  resolveType: (value) => {
    if (value instanceof GraphQLException) {
      return InvalidEmailException;
    } else {
      return User;
    }
  },
});

const UpdatePasswordResult = createUnionType({
  name: 'UpdatePasswordResult',
  types: () => [User, WrongPasswordException],
  resolveType: (value) => {
    if (value instanceof GraphQLException) {
      return WrongPasswordException;
    } else {
      return User;
    }
  },
});

@Resolver((of) => User)
export class UsersResolver {
  constructor(
    private legacyUserService: LegacyUserService,
    private authenticationService: AuthenticationService,
    private certificateService: CertificateService,
    private administratorService: AdministratorService,
  ) {}

  /* Fields */

  /* the field username is resolved to the field uid */
  @ResolveField('username', (returns) => String)
  async getUsername(@Parent() user: LegacyUserEntity) {
    return user.uid;
  }

  @ResolveField('certificates', (returns) => [Certificate])
  async getCertificates(@Parent() user: LegacyUserEntity) {
    return this.certificateService.findByUser(user);
  }

  @ResolveField('isAdmin', (returns) => Boolean)
  async getAdmin(@Parent() user: LegacyUserEntity) {
    return this.administratorService.isAdmin(user.uid);
  }

  /* Queries */

  @Query((returns) => User, { description: 'Retrieves the current user' })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: LegacyUserEntity) {
    return user;
  }

  /* Mutations */

  @Mutation((returns) => AuthenticationResult, {
    description: 'Logs a user in and returns a new valid session id',
  })
  @UseGuards(ThrottlerBehindProxyGuard)
  async authenticate(
    @Args({ name: 'username' }) username: string,
    @Args({ name: 'password' }) password: string,
    @GraphQLRequest() request: Request,
  ) {
    const isAdmin = await this.administratorService.isAdmin(username);

    if (isAdmin) {
      return createAuthenticationException(
        'The provided username and password combination does not exist',
      );
    }

    // obtain IP
    const ip_address =
      (request.headers['x-forwarded-for'] as string) ||
      (request.ips.length ? request.ips[0] : request.ip);

    const session = await this.authenticationService.authenticateUser(
      username,
      password,
      ip_address,
    );
    if (session) {
      return session;
    } else {
      return createAuthenticationException(
        'The provided username and password combination does not exist',
      );
    }
  }

  @Mutation((returns) => Boolean, {
    description: 'Logs a user out, deletes the session id',
  })
  @UseGuards(GqlAuthGuard)
  async logout(@CurrentSessionId() session_id: string | undefined) {
    if (session_id && session_id.length > 0) {
      const result = await this.authenticationService.removeSession(session_id);
      if (result.affected) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  @Mutation((returns) => UpdateUserResult, {
    description: 'Updates the current user using the provided data',
  })
  @UseGuards(GqlAuthGuard)
  async updateMe(
    @Args({ name: 'firstname' }) firstname: string,
    @Args({ name: 'lastname' }) lastname: string,
    @Args({ name: 'email' }) email: string,
    @CurrentUser() user: LegacyUserEntity,
  ) {
    try {
      const updatedUser = await this.legacyUserService.update(
        user,
        firstname,
        lastname,
        email,
      );

      return updatedUser;
    } catch (e) {
      return createInvalidEmailException('The passed email is invalid');
    }
  }

  @Mutation((returns) => UpdatePasswordResult, {
    description: "Updates the current user's password",
  })
  @UseGuards(GqlAuthGuard)
  async updatePassword(
    @Args({ name: 'newPassword' }) newPassword: string,
    @Args({ name: 'oldPassword' }) oldPassword: string,
    @CurrentUser() user: LegacyUserEntity,
    @CurrentSessionId() session_id: string | undefined,
  ) {
    if (await this.authenticationService.validatePassword(user, oldPassword)) {
      const updatedUser = await this.legacyUserService.updatePassword(
        user,
        newPassword,
      );

      if (session_id) {
        await this.authenticationService.removeSessionsByUserExcept(
          user,
          session_id,
        );
      }

      return updatedUser;
    } else {
      return createWrongPasswordException('The provided old password is wrong');
    }
  }
}
