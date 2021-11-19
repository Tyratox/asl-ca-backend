import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AdministratorService } from '../administrator.service';

@Injectable()
export class GqlAdminGuard implements CanActivate {
  constructor(private administratorService: AdministratorService) {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = this.getRequest(context);

    return req?.user?.uid && this.administratorService.isAdmin(req.user.uid);
  }
}
