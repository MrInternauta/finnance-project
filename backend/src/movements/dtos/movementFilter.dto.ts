import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsDate, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export class MovementsFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'name for movement' })
  name: string;

  @IsOptional()
  @IsDate()
  @ApiProperty({ description: 'date for movement' })
  startDate: Date;

  @IsOptional()
  @IsDate()
  @ApiProperty({ description: 'date for movement' })
  endDate: Date;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  type?: 'income' | 'expense' | 'all' = 'all';
}
