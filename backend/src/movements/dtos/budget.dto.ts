import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateBudgetDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'category the budget applies to' })
  categoryId: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'budgeted amount (MXN)' })
  amount: number;
}

export class UpdateBudgetDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'budgeted amount (MXN)' })
  amount: number;
}
