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

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateMovementDto, UpdateMovementDto } from '../dtos/movement.dto';
import { MovementsFilterDto } from '../dtos/movementFilter.dto';
import { MovementsService } from '../services/movements.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private movementsService: MovementsService) {}

  //Getting obj query Params: @Query() params: any and params.limit
  @Get()
  @Is_PublicD()
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
  async getmovements(
    @Query() params: MovementsFilterDto & FilterDto
    // @Query('offset') offset = 10,
  ) {
    return { movements: await this.movementsService.findAll(params) };
  }

  //Getting obj params: Can use  Param() params: any and params.movementId
  @Get(':movementId')
  @Is_PublicD()
  @ApiOperation({
    summary: 'Get movement by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getMovement(@Res() res: Response, @Param('movementId', ParseIntPipe) movementId: number) {
    res.json({
      movement: await this.movementsService.findOne(movementId),
    });
  }
  
  @Post()
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a movement',
  })
  async create(@Body() movement: CreateMovementDto) {
    return {
      message: 'Movement created',
      movement: await this.movementsService.create(movement),
    };
  }

  @Put(':movementId')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN)
  @ApiOperation({
    summary: 'Update a movement',
  })
  async update(@Param('movementId', ParseIntPipe) movementId: number, @Body() movement: UpdateMovementDto) {
    const wasUpdated = await this.movementsService.update(movementId, movement);
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

  @RoleD(Role.ADMIN)
  @Put(':idMovement/restore')
  @ApiOperation({
    summary: 'restore an movement',
  })
  async restore(@Res() res: Response, @Param('idMovement', ParseIntPipe) idMovement: number) {
    const wasUpdated = await this.movementsService.restore(idMovement);
    if (wasUpdated?.affected > 0) {
      res.status(HttpStatus.OK).json({ message: 'Movement restored', movement: wasUpdated });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ message: `Movement ${idMovement} not restored` });
    }
  }

  //Use ParseIntPipe to parse the param to int (in the traspilation to JS)
  @Delete(':movementId')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a movement',
  })
  async delete(@Param('movementId', ParseIntPipe) movementId: number) {
    await this.movementsService.remove(movementId);
    return {
      message: `Movement ${movementId} deleted`,
    };
  }
}
