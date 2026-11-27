import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ description: 'Email of the account to recover' })
  readonly email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Reset token sent by email' })
  readonly token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'New password' })
  readonly password: string;
}
