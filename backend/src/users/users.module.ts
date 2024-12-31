import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { MovementsModule } from '../movements/movements.module';
import { ProfileController } from './controllers/profile.controller';
import { RolesController } from './controllers/rols.controller';
import { UsersController } from './controllers/users.controller';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { RolesService } from './services/roles.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [MovementsModule, TypeOrmModule.forFeature([User, Role, Permission])],
  exports: [UsersService, RolesService],
  providers: [UsersService, RolesService],
  controllers: [UsersController, ProfileController, RolesController],
})
export class UsersModule {}
