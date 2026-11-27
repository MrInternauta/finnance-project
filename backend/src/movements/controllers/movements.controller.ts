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
import { csvNumberCell, csvRow, csvTextCell } from '../../core/util/csv';
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

  @Get('summary/monthly')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Monthly movements summary',
    description: 'Income/expense totals grouped by calendar month for the authenticated user',
  })
  @HttpCode(HttpStatus.OK)
  async getMonthlySummary(@Query() params: MovementsSummaryFilterDto, @CurrentUser() user: PayloadToken) {
    return { months: await this.movementsService.getMonthlySummary(user.sub, params?.from, params?.to) };
  }

  @Get('export')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Export movements as CSV',
    description: 'Downloads the authenticated user movements within the date range as a CSV file',
  })
  @HttpCode(HttpStatus.OK)
  async exportCsv(@Res() res: Response, @Query() params: MovementsSummaryFilterDto, @CurrentUser() user: PayloadToken) {
    const movements = await this.movementsService.exportCsv(user.sub, params?.from, params?.to);

    const lines = [csvRow(['fecha', 'nombre', 'categoria', 'tipo', 'monto', 'descripcion'])];
    for (const movement of movements) {
      lines.push(
        csvRow([
          csvTextCell(movement.date.toISOString().slice(0, 10)),
          csvTextCell(movement.name),
          csvTextCell(movement.category?.name ?? 'Sin categoría'),
          csvTextCell(movement.income ? 'ingreso' : 'gasto'),
          csvNumberCell(movement.quantity),
          csvTextCell(movement.description),
        ])
      );
    }

    const filename = `movimientos-${params?.from?.toISOString().slice(0, 10) ?? 'inicio'}-${
      params?.to?.toISOString().slice(0, 10) ?? 'hoy'
    }.csv`;
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      .send('﻿' + lines.join('\r\n'));
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
