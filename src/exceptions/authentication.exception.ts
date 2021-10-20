import { Field, ObjectType } from '@nestjs/graphql';
import { Exception } from './exception.model';

@ObjectType({
  description: 'An exception that is raised during authentication',
})
export class AuthenticationException extends Exception {}

export const createAuthenticationException = (message: string) =>
  new Error(message);
