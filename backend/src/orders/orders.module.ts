import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [PrismaModule],
  providers: [OrdersService, JwtAuthGuard],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
