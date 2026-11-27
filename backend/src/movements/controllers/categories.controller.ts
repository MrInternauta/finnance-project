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
import { FilterDto } from '../../core/interfaces/filter.dto';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';
import { CategoriesService, Requester } from '../services/categories.service';
import { MovementsService } from '../services/movements.service';

const isAdmin = (user: PayloadToken) => user.role?.toLowerCase() === Role.ADMIN;

const requesterOf = (user: PayloadToken): Requester => ({ userId: user.sub, isAdmin: isAdmin(user) });

/** Adds isDefault so clients can tell global categories from their own. */
const withIsDefault = (category: Category) => ({ ...category, isDefault: category?.user == null });

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('categories')
export class CategoriesController {
  constructor(private categoriesServices: CategoriesService, private productsServices: MovementsService) {}

  @Get()
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Categories list',
    description: 'Global default categories plus the categories owned by the authenticated user',
  })
  async getCategories(@Query() params: FilterDto, @CurrentUser() user: PayloadToken) {
    const categories = await this.categoriesServices.findVisible(params, user.sub);
    return { categories: categories.map(withIsDefault) };
  }

  //Getting obj params: Can use  Param() params: any and params.productId
  @Get(':categoryId')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get category by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getCategory(
    @Res() res: Response,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() user: PayloadToken
  ) {
    return {
      category: withIsDefault(await this.categoriesServices.findOneVisible(categoryId, user.sub)),
    };
  }

  @Post()
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  async create(@Body() category: CreateCategoryDto, @CurrentUser() user: PayloadToken) {
    return {
      message: 'Category created',
      product: await this.categoriesServices.create(category, requesterOf(user)),
    };
  }

  @Put(':idCategory')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Update a category',
  })
  async update(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
    @Body() category: UpdateCategoryDto,
    @CurrentUser() user: PayloadToken
  ) {
    const wasUpdated = await this.categoriesServices.update(idCategory, category, requesterOf(user));
    if (wasUpdated) {
      res.status(HttpStatus.OK).json({ message: 'Category updated', category: wasUpdated });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ message: `Category ${idCategory} not updated` });
    }
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Put(':idCategory/restore')
  @ApiOperation({
    summary: 'restore a category',
  })
  async restore(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
    @CurrentUser() user: PayloadToken
  ) {
    const wasUpdated = await this.categoriesServices.restore(idCategory, requesterOf(user));
    if (wasUpdated?.affected > 0) {
      res.status(HttpStatus.OK).json({ message: 'Category restored', category: wasUpdated });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ message: `Category ${idCategory} not restored` });
    }
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Delete(':idCategory')
  @ApiOperation({
    summary: 'Delete a category',
  })
  async delete(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
    @CurrentUser() user: PayloadToken
  ) {
    await this.categoriesServices.remove(idCategory, requesterOf(user));
    res.status(HttpStatus.OK).json({ message: `Category ${idCategory} deleted` });
  }
}
