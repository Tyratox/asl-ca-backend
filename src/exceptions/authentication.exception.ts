import { Field, ObjectType } from '@nestjs/graphql';
import { Exception, GraphQLException } from './exception.model';

@ObjectType({
  description: 'An exception that is raised during authentication',
})
export class AuthenticationException extends Exception {}

export const createAuthenticationException = (message: string) =>
  new GraphQLException(message);
