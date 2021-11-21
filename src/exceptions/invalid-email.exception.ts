import { ObjectType } from '@nestjs/graphql';
import { Exception, GraphQLException } from './exception.model';

@ObjectType({
  description: 'An exception that is raised during authentication',
})
export class InvalidEmailException extends Exception {}

export const createInvalidEmailException = (message: string) =>
  new GraphQLException(message);
