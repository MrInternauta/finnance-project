import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Between, FindOptionsWhere, Repository } from 'typeorm';

import { CreateMovementDto, UpdateMovementDto } from '../dtos/movement.dto';
import { MovementsFilterDto } from '../dtos/movementFilter.dto';
import { Product } from '../entities/movement.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private categoryService: CategoriesService
  ) {}

  public async findAll(params?: MovementsFilterDto) {
    if (!params)
      return this.productRepo.find({
        relations: ['category'],
      });
    const where: FindOptionsWhere<Product> = {};
    const { limit, offset } = params;
    if (params?.name) {
      where.name = params.name;
    }

    if (params?.categoryId) {
      where.category = { id: params.categoryId };
    }

    const res = await this.productRepo.find({
      relations: ['category'],
      take: limit,
      skip: offset,
      where,
      order: { date: 'DESC' },
    });

    console.log(res);
    return res;
  }

  public async findOne(idProduct: number, whithRelations = true) {
    const product = await this.productRepo.findOne({
      relations: whithRelations ? ['category'] : [],
      where: { id: idProduct },
    });
    if (!product) {
      throw new NotFoundException(`Product ${idProduct} not found`);
    } else {
      return product;
    }
  }

  findOnebyName(name: string) {
    return this.productRepo.find({
      where: { name },
      take: 1,
      withDeleted: true,
    });
  }

  findOnebyCode(code: string) {
    return this.productRepo.find({
      take: 1,
      withDeleted: true,
    });
  }

  async validateUniqueName(name: string) {
    const items = await this.findOnebyName(name);
    if (items && items.length > 0) {
      throw new BadRequestException(`Product with name '${name}' already exists`);
    }
  }

  async validateUniqueCode(code: string) {
    const items = await this.findOnebyCode(code);
    if (items && items.length > 0) {
      throw new BadRequestException(`Product with code '${code}' already exists`);
    }
  }

  public async create(payload: CreateMovementDto) {
    try {
      await this.validateUniqueName(payload.name);
      const product = this.productRepo.create(payload);
      if (payload.categoryId) {
        const categories = await this.categoryService.findById(payload.categoryId);
        product.category = categories;
      }
      return this.productRepo.save(product);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  public async update(id: number, payload: UpdateMovementDto) {
    try {
      if (payload?.name) {
        const productsItems = await this.findOnebyName(payload?.name);
        if (productsItems && productsItems.length > 0 && id.toString() !== productsItems[0].id?.toString()) {
          throw new BadRequestException(`Product with name '${payload?.name}' already exists`);
        }
      }

      let product = await this.findOne(id);
      if (payload?.categoryId) {
        const categories = await this.categoryService.findById(payload.categoryId);
        product.category = categories;
      }
      product = this.productRepo.merge(product, payload);
      return this.productRepo.save(product);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }




  public async remove(id: number) {
    await this.findOne(id);
    return this.productRepo.softDelete({ id });
  }

  public async restore(id: number) {
    return this.productRepo.restore({ id });
  }

  defaultProducts() {
    const defaultProduct: Array<CreateMovementDto> = [
      {
        categoryId: 1,
        userId: 1,
        name: 'Product 1',
        quantity: 10,
        date: new Date(),
        income: true,
      },
      {
        categoryId: 2,
        userId: 1,
        name: 'Product 2',
        quantity: 40,
        date: new Date(),
        income: true,
      },
      {
        categoryId: 3,
        userId: 1,
        name: 'Product 3',
        quantity: 20,
        date: new Date(),
        income: false
      },
      {
        categoryId: 4,
        userId: 1,
        name: 'Product 4',
        quantity: 30,
        date: new Date(),
        income: false
      },
      {
        categoryId: 5,
        userId: 1,
        name: 'Product 5',
        quantity: 50,
        date: new Date(),
        income: true,
      }

    ];
    return defaultProduct;
  }
}
