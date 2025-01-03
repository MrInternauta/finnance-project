import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { config } from '../config';
import { CategoriesService } from '../movements/services/categories.service';
import { MovementsService } from '../movements/services/movements.service';
import { RolesService } from '../users/services/roles.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class AppService {
  constructor(
    private rolesService: RolesService,
    private usersService: UsersService,
    private categoriesServices: CategoriesService,
    private productsServices: MovementsService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>
  ) {}

  async setDefaultValues() {
    try {
      const roles = this.rolesService.defaultValuesRole();
      
      const role_admin = await this.rolesService.create({
        name: roles.role_admin.name,
        permissions: roles.role_admin.permissions,
      });

      const role_cashier = await this.rolesService.create({
        name: roles.role_cashier.name,
        permissions: roles.role_cashier.permissions,
      });

      const role_client = await this.rolesService.create({
        name: roles.role_client.name,
        permissions: roles.role_client.permissions,
      });

      const users = this.usersService.defaultValuesUser();

      const admin = await this.usersService.create(users.admin);
      const cashier = await this.usersService.create(users.cashier);
      const client = await this.usersService.create(users.client);

      console.log(admin, cashier, client);

      admin.role = role_admin;
      await this.usersService.update(admin.id, admin);

      cashier.role = role_cashier;
      await this.usersService.update(cashier.id, cashier);

      client.role = role_client;
      await this.usersService.update(client.id, client);

      console.log(admin, cashier, client);

      const categories = this.categoriesServices.defaultValue();
      categories.map(async item => {
        await this.categoriesServices.create(item);
      });

      const products = this.productsServices.defaultProducts();
      products.map(async item => {
        await this.productsServices.create(item);
      });

      return {
        message: 'Values set successfully!',
      };
      
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Values already set');
    }
  }

  /**
   * @version 0.0.1
   * @function existImage
   * @description Verifica que la imagen exista o retorna una imagen por defecto
   * @param {Request} [req] Request de la petición HTTP
   * @param {Response} res Response de la petición HTTP
   * @returns {object} Retorna de respuesta al cliente en formato FILE
   */
  public async getImage(type = 'user', img: string, res: Response) {
    const pathImg = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${type}/${img}`);

    if (fs.existsSync(pathImg)) {
      res.sendFile(pathImg);
    } else {
      const noImagePath = path.join(
        __dirname,
        `../../${this.configService.IMAGES_PATH}` + `/${type}/` + 'no-image.jpg'
      );
      res.sendFile(noImagePath);
    }
  }

  public async updateImgeUser(id: number, res: Response, file) {
    try {
      this.imageValidations(file);
      const nombreCortado = file?.originalname.split('.');
      const extension = nombreCortado[nombreCortado.length - 1];
      const user = await this.usersService.findOne(id);
      if (!user) {
        throw new BadRequestException('User was not found');
      }
      const nombreArchivo = `${id}.${extension}`;
      this.removeFile(path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'user'}/${user?.image}`), 'user');

      const pathImagen = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'user'}/${nombreArchivo}`);
      fs.writeFile(pathImagen, file.buffer, async err => {
        if (err) {
          throw new BadRequestException('Error al actualizar');
        }
        console.log('The file was saved!', pathImagen);
        const newUser = await this.usersService.update(Number(id), { ...user, image: nombreArchivo });
        delete newUser.password;
        res.json(newUser);
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  imageValidations(file) {
    const nombreCortado = file?.originalname.split('.');
    const extension = nombreCortado[nombreCortado.length - 1];

    // Extensiones permitidas
    const extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
      throw new BadRequestException('Las extensiones permitidas son ' + extensionesValidas.join(', '));
    }
  }

  private removeFile(nameImage, type = 'user') {
    const pathImagen = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${type}/${nameImage}`);
    if (fs.existsSync(pathImagen)) {
      fs.unlinkSync(pathImagen);
    }
  }
}
