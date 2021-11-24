import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService) {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    const authHeader = request.headers.authorization as string;

    if (!authHeader) {
      throw new BadRequestException('Authorization header not found.');
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      throw new BadRequestException(
        `Authentication type \'Bearer\' required. Found \'${type}\'`,
      );
    }

    const ip_address =
      (request.headers['x-forwarded-for'] as string) ||
      (request.ips.length ? request.ips[0] : request.ip);

    const session = await this.authenticationService.validateToken(
      token,
      ip_address,
    );

    if (!session) {
      throw new UnauthorizedException('Token not valid');
    }

    request.user = session.user;
    request.session_id = session.session_id;

    return true;
  }
}
