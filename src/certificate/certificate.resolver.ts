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
  Int,
} from '@nestjs/graphql';
import { type } from 'os';
import { GraphQLException } from '../exceptions/exception.model';
import { GqlAdminGuard } from '../user/authentication/graphql-admin.guard';
import {
  createNotFoundException,
  NotFoundException,
} from '../exceptions/not-found.exception';
import { CurrentUser } from '../user/authentication/current-user.decorator';
import { GqlAuthGuard } from '../user/authentication/graphql-auth.guard';
import { LegacyUserEntity } from '../user/legacy-user.entity';
import { Certificate } from './certificate.model';
import { CertificateService } from './certificate.service';
import { NewCertificate } from './new-certificate.model';
import { RevokeCertificateSuccess } from './RevokeCertificateSucess.model';
import { ThrottlerBehindProxyGuard } from '../throttler-behind-proxy.guard';

const RevokeCertificateReponse = createUnionType({
  name: 'RevokeCertificateReponse',
  types: () => [RevokeCertificateSuccess, NotFoundException],
  resolveType: (value) => {
    if (value instanceof GraphQLException) {
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

  /* Queries */

  @Query((returns) => String, {
    description: 'The current certificate revocation list encoded in Base64',
  })
  async crl() {
    return this.certificateService.getCertificateRevocationList();
  }

  @Query((returns) => String, {
    description: 'Current serial number.',
  })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async getSerialNumber() {
    return this.certificateService.serialNumber();
  }

  @Query((returns) => Int, {
    description: 'The total number of certificates.',
  })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async getCertCount() {
    return this.certificateService.countAll();
  }

  @Query((returns) => Int, {
    description: 'The total number of revoked certificates.',
  })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async getRevokedCertCount() {
    return this.certificateService.countAllRevoked();
  }

  /* Mutations */
  @Mutation((returns) => NewCertificate, {
    description: 'Generates a new certificate',
  })
  @UseGuards(GqlAuthGuard, ThrottlerBehindProxyGuard)
  async generateCertificate(
    @Args({ name: 'name' }) name: string,
    @Args({ name: 'password' }) password: string,
    @CurrentUser() user: LegacyUserEntity,
  ) {
    try {
      return this.certificateService.generateCertificateForUser(
        user,
        name,
        password,
      );
    } catch (e) {
      throw new Error(
        'Error during certificate generation, please contact the support. (If you tried to find an exploit you now have to reset the CA machine, sorry.)',
      );
    }
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
    if (certificate && !certificate.is_revoked) {
      await this.certificateService.revokeCertificate(certificate);
      return { success: true };
    } else {
      return createNotFoundException("The certificate wasn't found");
    }
  }
}
