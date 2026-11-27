import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { User } from '../../../users/entities/user.entity';
import { LOCAL_STRATEGY } from '../constants/auth';
import { ForgotPasswordDto, ResetPasswordDto } from '../dtos/password-reset.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@UseGuards(ThrottlerGuard) // 5 req / 60 s per IP — login + password reset only, not the rest of the API
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard(LOCAL_STRATEGY))
  @Post('')
  login(@Req() request: Request) {
    const user = request.user as User;
    return this.authService.generateToken(user);
  }

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() payload: ForgotPasswordDto) {
    await this.authService.forgotPassword(payload.email);
    // Always the same answer so the endpoint can't be used to enumerate users.
    return { message: 'If the email exists, a reset link was sent' };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() payload: ResetPasswordDto) {
    await this.authService.resetPassword(payload.token, payload.password);
    return { message: 'Password updated' };
  }
}
