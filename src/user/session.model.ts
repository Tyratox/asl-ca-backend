import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Session {
  @Field((type) => ID, { description: 'The session id' })
  session_id: string;
}
