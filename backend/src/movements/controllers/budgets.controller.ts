import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/budget.dto';
import { MovementsSummaryFilterDto } from '../dtos/movementFilter.dto';
import { BudgetsService } from '../services/budgets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('budgets')
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'List budgets',
    description: 'Budgets of the authenticated user with the amount spent in the given date range',
  })
  @HttpCode(HttpStatus.OK)
  async getBudgets(@Query() params: MovementsSummaryFilterDto, @CurrentUser() user: PayloadToken) {
    return { budgets: await this.budgetsService.findAll(user.sub, params?.from, params?.to) };
  }

  @Post()
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a budget' })
  @HttpCode(HttpStatus.OK)
  async create(@Body() budget: CreateBudgetDto, @CurrentUser() user: PayloadToken) {
    return {
      message: 'Budget created',
      budget: await this.budgetsService.create(budget, user.sub),
    };
  }

  @Put(':budgetId')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Update a budget amount' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('budgetId', ParseIntPipe) budgetId: number,
    @Body() changes: UpdateBudgetDto,
    @CurrentUser() user: PayloadToken
  ) {
    return {
      message: `Budget updated: ${budgetId}`,
      budget: await this.budgetsService.update(budgetId, changes, user.sub),
    };
  }

  @Delete(':budgetId')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Delete a budget' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('budgetId', ParseIntPipe) budgetId: number, @CurrentUser() user: PayloadToken) {
    await this.budgetsService.remove(budgetId, user.sub);
    return { message: `Budget deleted: ${budgetId}` };
  }
}
