import { Field, Int, ID, ObjectType } from '@nestjs/graphql';
import { Certificate } from '../certificate/certificate.model';

@ObjectType({
  description:
    'The user type contains all information about the user, including the data from the legacy database',
})
export class User {
  @Field((type) => ID, { description: 'The uid from the legacy database' })
  username: string;

  @Field({ description: "The user's firstname from the legacy database" })
  firstname: string;

  @Field({ description: "The user's lastname from the legacy database" })
  lastname: string;

  @Field({ description: "The user's email from the legacy database" })
  email: string;

  @Field({
    description: 'Boolean indicating if a user is an administrator or not.',
  })
  isAdmin: boolean;

  @Field((type) => [Certificate], {
    description: 'The certificates of the user',
  })
  certificates: Certificate[];
}
