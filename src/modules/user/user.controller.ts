import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  Req,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './user.schema';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    await this.userService.sendConfirmationCode(
      registerUserDto.recipient,
      registerUserDto.type,
    );
    return { message: 'Confirmation code sent' };
  }

  @Post('confirm')
  async confirm(
    @Body() confirmRegistrationDto: ConfirmRegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isValid = await this.userService.confirm(
      confirmRegistrationDto.recipient,
      confirmRegistrationDto.code,
    );
    if (isValid) {
      const { user, token } = await this.userService.create(
        confirmRegistrationDto.user,
      );
      res.cookie('jwt', token, { httpOnly: true });
      return { user };
    } else {
      throw new BadRequestException('Invalid confirmation code');
    }
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.userService.login(loginUserDto);
    res.cookie('jwt', token, { httpOnly: true });
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req) {
    return { user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    return this.userService.findAll(page, limit, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: boolean) {
    return this.userService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/courses')
  updateCourses(@Param('id') id: string, @Body('courses') courseIds: string[]) {
    return this.userService.updateCourses(id, courseIds);
  }
}
