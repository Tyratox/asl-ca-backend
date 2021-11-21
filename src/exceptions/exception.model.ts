import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Exception {
  @Field({ description: 'A message describing why the exception occured' })
  message: string;
}

export class GraphQLException {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
