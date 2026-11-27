import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';

import { config } from '../../../config';
import { User } from '../../../users/entities/user.entity';
import { UsersService } from '../../../users/services/users.service';
import { PasswordResetToken } from '../../../users/entities/password-reset-token.entity';
import { PayloadToken } from '../models/token.model';
import { MailService } from './mail.service';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(PasswordResetToken) private resetTokenRepo: Repository<PasswordResetToken>,
    @Inject(config.KEY) private configService: ConfigType<typeof config>
  ) {}

  async validateUser(userName: string, password: string) {
    const LOAD_ROLE = true;
    const user = await this.userService.findByEmail(userName, LOAD_ROLE);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ForbiddenException('User or password wrong!');
    }
    return user;
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }

  generateToken(user: User) {
    const payload: PayloadToken = { role: user?.role?.name || 'Client', sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Do not reveal whether the account exists.
      return;
    }

    await this.resetTokenRepo.update({ user: { id: user.id }, usedAt: IsNull() }, { usedAt: new Date() });

    const rawToken = randomBytes(32).toString('hex');
    const token = this.resetTokenRepo.create({
      user,
      tokenHash: this.hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    await this.resetTokenRepo.save(token);

    const baseUrl = this.configService.frontend_url || '';
    const resetLink = `${baseUrl}/authentication/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordReset(user.email, resetLink);
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken);
    const token = await this.resetTokenRepo.findOne({
      relations: ['user'],
      where: { tokenHash, usedAt: IsNull() },
    });

    if (!token || token.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.updatePassword(token.user, hashedPassword);

    token.usedAt = new Date();
    await this.resetTokenRepo.save(token);
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
