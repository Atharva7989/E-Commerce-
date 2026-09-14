import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [PrismaModule],
  providers: [CheckoutService, JwtAuthGuard],
  controllers: [CheckoutController],
  exports: [CheckoutService],
})
export class CheckoutModule {}
