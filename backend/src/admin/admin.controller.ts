import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -------------------------------------------------------------
  // Dashboard Metrics
  // -------------------------------------------------------------
  @Get('metrics')
  async getMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  // -------------------------------------------------------------
  // Products Management
  // -------------------------------------------------------------
  @Get('products')
  async getProducts() {
    return this.adminService.getProducts();
  }

  @Post('products')
  async createProduct(@Body() dto: CreateAdminProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateAdminProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // -------------------------------------------------------------
  // Orders Management
  // -------------------------------------------------------------
  @Get('orders')
  async getOrders() {
    return this.adminService.getOrders();
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  @Patch('orders/:id/shipping')
  async updateShipping(
    @Param('id') id: string,
    @Body() dto: UpdateShippingDto,
  ) {
    return this.adminService.updateShipping(id, dto);
  }
}
