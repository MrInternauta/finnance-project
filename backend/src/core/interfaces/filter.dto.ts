import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(50)
  @ApiProperty({ description: 'limit for paginations' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @ApiProperty({ description: 'offset for paginations' })
  offset?: number;
}
