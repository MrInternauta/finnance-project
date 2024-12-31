import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { FilterDto } from '../../core/interfaces/filter.dto';

@Controller('profile')
@ApiTags('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor() {}

  @RoleD(Role.CUSTOMER)
  @Get('my-orders')
  getOrders(@Req() req: Request, @Query() params: FilterDto) {
    const user = req.user as PayloadToken;
    return { user, params};
  }
}
