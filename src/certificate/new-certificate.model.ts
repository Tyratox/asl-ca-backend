import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CertificateEntity } from './certificate.entity';
import { Certificate } from './certificate.model';

@ObjectType()
export class NewCertificate {
  @Field((type) => Certificate, { description: 'The certificate' })
  certificate: CertificateEntity;

  @Field({
    description: 'The prvate key encoded in Base64',
  })
  privateKey: string;
}
