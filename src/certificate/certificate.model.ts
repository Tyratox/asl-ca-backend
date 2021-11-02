import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Certificate {
  @Field((type) => ID, { description: 'The certificate id' })
  id: string;

  @Field({
    description:
      'A name given in order to be able to differentiate the certificates',
  })
  name: string;

  @Field({ description: 'Has the certificate been revoked?' })
  is_revoked: boolean;

  @Field({ description: 'The date the certificate has been created' })
  created_at: Date;

  @Field({ description: 'The date the certificate has last been updated' })
  updated_at: Date;
}
