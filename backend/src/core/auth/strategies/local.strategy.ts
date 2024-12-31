import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-local';

import { LOCAL_STRATEGY } from '../constants/auth';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_STRATEGY) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(username: string, password: string) {
    try {
      const user = await this.authService.validateUser(username, password);
      return user;
    } catch (error) {
      throw new UnauthorizedException('User or password wrong!');
    }
  }
}
