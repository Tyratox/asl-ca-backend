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
    const req = this.getRequest(context);

    const authHeader = req.headers.authorization as string;

    if (!authHeader) {
      throw new BadRequestException('Authorization header not found.');
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      throw new BadRequestException(
        `Authentication type \'Bearer\' required. Found \'${type}\'`,
      );
    }
    const session = await this.authenticationService.validateToken(token);

    if (!session) {
      throw new UnauthorizedException('Token not valid');
    }

    req.user = session.user;
    req.session_id = session.session_id;

    return true;
  }
}
