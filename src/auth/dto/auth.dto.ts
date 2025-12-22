import { IsEmail, IsString, MinLength, IsBoolean, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsBoolean({ message: 'Terms acceptance must be a boolean value' })
  @IsNotEmpty({ message: 'Terms acceptance is required' })
  termsAccepted: boolean;
}

export class LoginResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
