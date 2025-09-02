import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/auth.guard';

@Controller('auth')
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
    console.log(req.user);
    return { user: req.user };
  }
}
