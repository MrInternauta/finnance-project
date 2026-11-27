import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { Resend } from 'resend';

import { config } from '../../../config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend?: Resend;

  constructor(@Inject(config.KEY) private configService: ConfigType<typeof config>) {
    if (configService.resend_api_key) {
      this.resend = new Resend(configService.resend_api_key);
    }
  }

  async sendPasswordReset(email: string, resetLink: string) {
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY is not configured; skipping password reset email');
      if (process.env.NODE_ENV !== 'prod') {
        this.logger.debug(`Password reset link for ${email}: ${resetLink}`);
      }
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.configService.resend_from || 'Finnance <no-reply@finnance.app>',
        to: email,
        subject: 'Restablecer tu contraseña — Finnance',
        html: `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por 30 minutos:</p>
        <p><a href="${resetLink}">Restablecer contraseña</a></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `,
      });
      // Never log the reset link or token; only the provider's error name/message.
      if (error) {
        this.logger.error(`Password reset email not sent: ${error.name} - ${error.message}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Password reset email not sent: ${message}`);
    }
  }
}
