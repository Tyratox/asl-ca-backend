import { UseGuards } from '@nestjs/common';
import {
  Args,
  createUnionType,
  ID,
  Query,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { type } from 'os';
import {
  createNotFoundException,
  NotFoundException,
} from 'src/exceptions/not-found.exception';
import { CurrentUser } from 'src/user/authentication/current-user.decorator';
import { GqlAuthGuard } from 'src/user/authentication/graphql-auth.guard';
import { LegacyUserEntity } from 'src/user/legacy-user.entity';
import { CertificateEntity } from './certificate.entity';
import { Certificate } from './certificate.model';
import { CertificateService } from './certificate.service';
import { NewCertificate } from './new-certificate.model';
import { RevokeCertificateSuccess } from './RevokeCertificateSucess.model';

const RevokeCertificateReponse = createUnionType({
  name: 'RevokeCertificateReponse',
  types: () => [RevokeCertificateSuccess, NotFoundException],
  resolveType: (value) => {
    if (value instanceof Error) {
      return NotFoundException;
    } else {
      return RevokeCertificateSuccess;
    }
  },
});

@Resolver((of) => Certificate)
export class CertificateResolver {
  constructor(private certificateService: CertificateService) {}

  /* Fields */

  @ResolveField('certificateFile', (returns) => String, {
    description: 'The corresponding certificate file encoded in Base64',
  })
  @UseGuards(GqlAuthGuard)
  async getCertificateFile(
    @Parent() certificate: CertificateEntity,
    @CurrentUser() user: LegacyUserEntity,
  ) {
    if (this.certificateService.findOneByIdAndUser(certificate.id, user)) {
      return this.certificateService.getCertificateFile(certificate);
    } else {
      //TODO: should we allow everyone to download certificates?
      return '';
    }
  }

  /* Queries */

  @Query((returns) => String, {
    description: 'The current certificate revocation list encoded in Base64',
  })
  async crl() {
    return this.certificateService.getCertificateRevocationList();
  }

  /* Mutations */

  @Mutation((returns) => NewCertificate, {
    description: 'Generates a new certificate',
  })
  @UseGuards(GqlAuthGuard)
  async generateCertificate(
    @Args({ name: 'name' }) name: string,
    @CurrentUser() user: LegacyUserEntity,
  ) {
    return this.certificateService.generateCertificateForUser(user, name);
  }

  @Mutation((returns) => RevokeCertificateReponse, {
    description: 'Revokes an existing certificate of the logged in user',
  })
  @UseGuards(GqlAuthGuard)
  async revokeCertificate(
    @Args({ name: 'id', type: () => ID }) id: string,
    @CurrentUser() user: LegacyUserEntity,
  ) {
    const certificate = await this.certificateService.findOneByIdAndUser(
      parseInt(id),
      user,
    );
    if (certificate) {
      await this.certificateService.revokeCertificate(certificate);
      return { success: true };
    } else {
      return createNotFoundException("The certificate wasn't found");
    }
  }
}
