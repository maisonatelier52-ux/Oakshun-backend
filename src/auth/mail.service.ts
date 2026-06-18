import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for port 465, false for other ports
        auth: { user, pass },
      });
      this.logger.log('SMTP Mailer configured successfully.');
    } else {
      this.logger.warn('SMTP configuration missing. Mail Service will run in Sandbox Mode (logging OTPs to console).');
    }
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    const subject = 'Oakshun Registration OTP Verification';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #0F172A; text-align: center;">Welcome to Oakshun</h2>
        <p>You are one step away from registering your account on Oakshun platform.</p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1E3A8A;">${otp}</span>
        </div>
        <p>This verification code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748B; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        const from = this.configService.get<string>('SMTP_FROM') || '"Oakshun Platform" <no-reply@oakshun.com>';
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          html: htmlContent,
        });
        this.logger.log(`OTP successfully sent via SMTP to: ${email}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email to ${email}`, error.stack);
      }
    }

    // Sandbox / Console Fallback
    console.log('\n======================================================');
    console.log(`✉️  [MAIL SANDBOX] Sending OTP to: ${email}`);
    console.log(`🔑  OTP Code: [ ${otp} ]`);
    console.log('======================================================\n');
    return true;
  }
}
