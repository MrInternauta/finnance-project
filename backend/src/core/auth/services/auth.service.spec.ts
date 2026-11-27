import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { Repository } from 'typeorm';

import { config } from '../../../config';
import { User } from '../../../users/entities/user.entity';
import { UsersService } from '../../../users/services/users.service';
import { PasswordResetToken } from '../../../users/entities/password-reset-token.entity';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';

describe('AuthService password reset', () => {
  let service: AuthService;
  let tokenRepo: jest.Mocked<Repository<PasswordResetToken>>;
  let usersService: { findByEmail: jest.Mock; updatePassword: jest.Mock };
  let mailService: { sendPasswordReset: jest.Mock };

  beforeEach(async () => {
    tokenRepo = {
      update: jest.fn(),
      create: jest.fn().mockImplementation(t => t as PasswordResetToken),
      save: jest.fn().mockImplementation(async t => t as PasswordResetToken),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PasswordResetToken>>;

    usersService = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };
    mailService = { sendPasswordReset: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: MailService, useValue: mailService },
        { provide: getRepositoryToken(PasswordResetToken), useValue: tokenRepo },
        { provide: config.KEY, useValue: { frontend_url: 'http://localhost:8100' } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('forgotPassword does nothing for an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await service.forgotPassword('nobody@test.com');

    expect(tokenRepo.save).not.toHaveBeenCalled();
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('forgotPassword invalidates old tokens, creates a new one and emails a link', async () => {
    const user = { id: 5, email: 'u@test.com' } as User;
    usersService.findByEmail.mockResolvedValue(user);

    await service.forgotPassword(user.email);

    expect(tokenRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 5 } }),
      expect.objectContaining({ usedAt: expect.any(Date) })
    );
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      })
    );
    const [email, link] = mailService.sendPasswordReset.mock.calls[0];
    expect(email).toBe('u@test.com');
    expect(link).toContain('http://localhost:8100/authentication/reset-password?token=');
  });

  it('resetPassword rejects an unknown token', async () => {
    tokenRepo.findOne.mockResolvedValue(null);
    await expect(service.resetPassword('bogus', 'newpass')).rejects.toThrow(BadRequestException);
  });

  it('resetPassword rejects an expired token', async () => {
    tokenRepo.findOne.mockResolvedValue({
      tokenHash: 'x',
      expiresAt: new Date(Date.now() - 1000),
      user: { id: 5 },
    } as PasswordResetToken);
    await expect(service.resetPassword('x', 'newpass')).rejects.toThrow('Invalid or expired token');
    expect(usersService.updatePassword).not.toHaveBeenCalled();
  });

  it('resetPassword hashes the password and marks the token used', async () => {
    const user = { id: 5, password: 'old' } as User;
    const token = {
      tokenHash: 'x',
      expiresAt: new Date(Date.now() + 60000),
      user,
    } as PasswordResetToken;
    tokenRepo.findOne.mockResolvedValue(token);

    await service.resetPassword('x', 'newpass');

    const [savedUser, hashed] = usersService.updatePassword.mock.calls[0];
    expect(savedUser).toBe(user);
    expect(hashed).not.toBe('newpass');
    expect(hashed.startsWith('$2')).toBe(true);
    expect(token.usedAt).toBeInstanceOf(Date);
    expect(tokenRepo.save).toHaveBeenCalledWith(token);
  });
});
