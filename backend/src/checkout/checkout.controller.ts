import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('summary')
  async getSummary(@Req() req) {
    const userId = req.user.sub;
    return this.checkoutService.getSummary(userId);
  }

  @Post('validate')
  async validateCheckout(
    @Req() req,
    @Body() body: { addressId?: string },
  ) {
    const userId = req.user.sub;
    return this.checkoutService.validateCheckout(userId, body?.addressId);
  }
}
