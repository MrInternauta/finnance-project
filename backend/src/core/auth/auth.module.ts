import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport/dist';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { config } from '../../config';
import { UsersModule } from '../../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { PasswordResetToken } from '../../users/entities/password-reset-token.entity';
import { AuthService } from './services/auth.service';
import { MailService } from './services/mail.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([PasswordResetToken]),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => ({
        secret: configService.jwt_secret,
        signOptions: {
          expiresIn: configService.jwt_expires_in,
        },
      }),
    }),
  ],
  providers: [AuthService, MailService, LocalStrategy, JwtStrategy],
  exports: [AuthService, MailService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
