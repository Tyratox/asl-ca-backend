import { ObjectType } from '@nestjs/graphql';
import { Exception } from './exception.model';

@ObjectType({
  description: 'An exception that is raised during authentication',
})
export class WrongPasswordException extends Exception {}

export const createWrongPasswordException = (message: string) =>
  new Error(message);
