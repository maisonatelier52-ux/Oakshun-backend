import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, LoginResponseDto, SendOtpDto } from './dto/auth.dto';
import { OtpService } from './otp.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private otpService: OtpService,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const userDoc = await this.usersService.findOne(email);
    if (userDoc && (await bcrypt.compare(password, userDoc.password))) {
      const userObj = userDoc.toObject();
      const { password, ...result } = userObj as any;
      result.id = userObj._id.toString();
      delete result._id;
      delete result.__v;
      return result;
    }
    return null;
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findOne(sendOtpDto.email);
    if (existingUser) {
      throw new ConflictException('This email already exists');
    }

    const otp = this.otpService.generateOtp(sendOtpDto.email);
    await this.mailService.sendOtp(sendOtpDto.email, otp);

    return { message: 'OTP sent successfully to your email.' };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    if (!registerDto.termsAccepted) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException('This email already exists');
    }

    // OTP verification removed by user request

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create(
      registerDto.email,
      registerDto.name,
      hashedPassword,
    );

    const payload = { email: user.email, sub: user._id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        KYC_verified: user.KYC_verified,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        KYC_verified: user.KYC_verified,
      },
    };
  }
}
