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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateMovementDto, UpdateMovementDto } from '../dtos/movement.dto';
import { MovementsFilterDto, MovementsSummaryFilterDto } from '../dtos/movementFilter.dto';
import { MovementsService } from '../services/movements.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private movementsService: MovementsService) {}

  //Getting obj query Params: @Query() params: any and params.limit
  @Get()
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'movements list',
    description: 'Get all movements',
    parameters: [
      {
        name: 'page',
        description: 'Page number',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of movements per page',
        in: 'query',
        required: false,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async getmovements(@Query() params: MovementsFilterDto, @CurrentUser() user: PayloadToken) {
    return { movements: await this.movementsService.findAll(params, user.sub) };
  }

  @Get('summary')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Movements summary',
    description: 'Income/expense totals and per-category breakdown for the authenticated user',
  })
  @HttpCode(HttpStatus.OK)
  async getSummary(@Query() params: MovementsSummaryFilterDto, @CurrentUser() user: PayloadToken) {
    return { summary: await this.movementsService.getSummary(user.sub, params?.from, params?.to) };
  }

  //Getting obj params: Can use  Param() params: any and params.movementId
  @Get(':movementId')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get movement by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getMovement(
    @Res() res: Response,
    @Param('movementId', ParseIntPipe) movementId: number,
    @CurrentUser() user: PayloadToken
  ) {
    res.json({
      movement: await this.movementsService.findOne(movementId, user.sub),
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Create a movement',
  })
  async create(@Body() movement: CreateMovementDto, @CurrentUser() user: PayloadToken) {
    return {
      message: 'Movement created',
      movement: await this.movementsService.create(movement, user.sub),
    };
  }

  @Put(':movementId')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Update a movement',
  })
  async update(
    @Param('movementId', ParseIntPipe) movementId: number,
    @Body() movement: UpdateMovementDto,
    @CurrentUser() user: PayloadToken
  ) {
    const wasUpdated = await this.movementsService.update(movementId, movement, user.sub);
    if (wasUpdated) {
      return {
        message: `Movement updated: ${movementId}`,
        movement: wasUpdated,
      };
    } else {
      return {
        message: `Movement ${movementId} not updated`,
      };
    }
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Put(':idMovement/restore')
  @ApiOperation({
    summary: 'restore an movement',
  })
  async restore(
    @Res() res: Response,
    @Param('idMovement', ParseIntPipe) idMovement: number,
    @CurrentUser() user: PayloadToken
  ) {
    const wasUpdated = await this.movementsService.restore(idMovement, user.sub);
    if (wasUpdated?.affected > 0) {
      res.status(HttpStatus.OK).json({ message: 'Movement restored', movement: wasUpdated });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ message: `Movement ${idMovement} not restored` });
    }
  }

  //Use ParseIntPipe to parse the param to int (in the traspilation to JS)
  @Delete(':movementId')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a movement',
  })
  async delete(@Param('movementId', ParseIntPipe) movementId: number, @CurrentUser() user: PayloadToken) {
    await this.movementsService.remove(movementId, user.sub);
    return {
      message: `Movement ${movementId} deleted`,
    };
  }
}
