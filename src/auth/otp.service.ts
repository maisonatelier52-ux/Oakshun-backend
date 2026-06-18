import { Injectable } from '@nestjs/common';

interface OtpData {
  otp: string;
  expiresAt: number;
}

@Injectable()
export class OtpService {
  // In-memory store for OTPs: key is email, value contains OTP and expiration
  private otpStore = new Map<string, OtpData>();
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  generateOtp(email: string): string {
    // Generate 6-digit random code
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }

    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;
    this.otpStore.set(email.toLowerCase(), { otp, expiresAt });
    return otp;
  }

  verifyOtp(email: string, otp: string): boolean {
    const key = email.toLowerCase();
    const storedData = this.otpStore.get(key);

    if (!storedData) {
      return false;
    }

    if (Date.now() > storedData.expiresAt) {
      this.otpStore.delete(key); // Clean up expired OTP
      return false;
    }

    const isValid = storedData.otp === otp;
    if (isValid) {
      this.otpStore.delete(key); // Consume/delete the OTP upon successful verification
    }
    return isValid;
  }
}
