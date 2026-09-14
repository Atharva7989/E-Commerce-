import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Req() req, @Body() dto: CreateOrderDto) {
    const userId = req.user.sub;
    return this.ordersService.createCodOrder(userId, dto);
  }

  @Get()
  async getOrders(@Req() req) {
    const userId = req.user.sub;
    return this.ordersService.getOrders(userId);
  }

  @Get(':id')
  async getOrderById(@Req() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.ordersService.getOrderById(userId, id);
  }
}
