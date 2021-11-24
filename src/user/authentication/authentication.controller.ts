import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CertificateService } from '../../certificate/certificate.service';
import { LegacyUserService } from '../legacy-user.service';
import { AuthenticationService } from './authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private certificateService: CertificateService,
    private userService: LegacyUserService,
    private configService: ConfigService,
  ) {}
  @Get('tls-cert')
  async tlsCert(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<string> {
    const clientCertSerial = request.headers['x-ssl-cert-serial'] as string;

    if (!clientCertSerial) {
      return 'Error: You need to provide a TLS client certificate!';
    }

    const certificate = await this.certificateService.findOneById(
      parseInt(clientCertSerial),
    );

    if (!certificate) {
      //NGINX was able to authenticate but we're not.. ?
      return 'Error: Something went very wrong.. Please report this!';
    }

    const user = await this.userService.findOneByUsername(certificate.userUid);

    if (!user) {
      return 'Error: Something went very wrong.. Please report this!';
    }

    const ip_address =
      (request.headers['x-forwarded-for'] as string) ||
      (request.ips.length ? request.ips[0] : request.ip);

    const session = await this.authenticationService.generateSessionForUser(
      user,
      ip_address,
    );

    const FRONTEND_URL = this.configService.get('FRONTEND_URL');

    if (session) {
      response.redirect(
        `${FRONTEND_URL}/login?token=${encodeURIComponent(session.session_id)}`,
      );
      return '';
    } else {
      return "Error: Couldn't generate a session! Please report this!";
    }
  }
}
