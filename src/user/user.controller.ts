import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard.ts.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  async getUserProfile(@Param('id') id: number) {
    return await this.userService.findById(id);
  }

  @UseGuards(JwtGuard)
  @Get()
  async getUsers(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
  ) {
    console.log(page,size);
    return this.userService.findAll(Number(page), Number(size));
  }
}
