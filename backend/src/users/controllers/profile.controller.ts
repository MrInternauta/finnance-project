import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MovementsService } from '../../movements/services/movements.service';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { MovementsFilterDto } from '../../movements/dtos/movementFilter.dto';

@Controller('profile')
@ApiTags('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private movementsService: MovementsService) {}

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Get('my-orders')
  getOrders(@CurrentUser() user: PayloadToken, @Query() params: MovementsFilterDto) {
    return this.movementsService.findAll(params, user.sub);
  }
}
