import { ThrottlerGuard } from '@nestjs/throttler';
import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  // extract IP from request. since begin nginx proxy, read 'X-Forwarded-For' header
  protected getTracker(req: Record<string, any>): string {
    const forwardFor = req.headers.authorization as string;

    if (!forwardFor) {
      throw new BadRequestException('X-Forwarded-For header not found.');
    }
    return forwardFor;
  }

  // make it work for graphql
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
