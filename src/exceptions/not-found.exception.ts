import { ObjectType } from '@nestjs/graphql';
import { Exception } from './exception.model';

@ObjectType({
  description: 'An exception that is raised during authentication',
})
export class NotFoundException extends Exception {}

export const createNotFoundException = (message: string) => new Error(message);
