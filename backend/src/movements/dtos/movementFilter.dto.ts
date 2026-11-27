import { ApiProperty } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

import { FilterDto } from '../../core/interfaces/filter.dto';

export class MovementsFilterDto extends FilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(500)
  @ApiProperty({ description: 'limit for paginations' })
  override limit?: number;
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'name for movement' })
  name: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'start of the date range (inclusive)' })
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'end of the date range (inclusive)' })
  to?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @ApiProperty({ description: 'filter by income (true) or expense (false)' })
  income?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  type?: 'income' | 'expense' | 'all' = 'all';
}

export class MovementsSummaryFilterDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'start of the date range (inclusive)' })
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty({ description: 'end of the date range (inclusive)' })
  to?: Date;
}
