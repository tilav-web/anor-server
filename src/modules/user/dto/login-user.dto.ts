import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class LoginUserDto {
  @IsOptional()
  @IsEmail()
  @ValidateIf(o => !o.phone)
  email?: string;

  @IsOptional()
  @IsString()
  @ValidateIf(o => !o.email)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
