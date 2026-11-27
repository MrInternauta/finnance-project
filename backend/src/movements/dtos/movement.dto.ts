import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateMovementDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  readonly id?: number;

  @IsNotEmpty({ message: `The name field can't be empty` })
  @IsString()
  @ApiProperty({ description: 'Name for the movement' })
  readonly name: string;

  @IsNotEmpty()
  @IsDate()
  @ApiProperty({ description: 'Date for the movement' })
  readonly date: Date;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'Quantity for the movement' })
  readonly quantity: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'Is an income or outcome' })
  readonly income: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Description for the movement' })
  readonly description?: string;

  @IsOptional()
  @ApiProperty()
  @IsNumber()
  readonly categoryId?: number;
}

export class UpdateMovementDto extends PartialType(CreateMovementDto) {}
