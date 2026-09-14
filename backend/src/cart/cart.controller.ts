import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    const userId = req.user.sub; // assuming JWT payload has sub
    return this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(@Req() req, @Body() createDto: CreateCartItemDto) {
    const userId = req.user.sub;
    return this.cartService.addItem(userId, createDto);
  }

  @Patch('items/:productId')
  async updateItem(@Req() req, @Param('productId') productId: string, @Body() updateDto: UpdateCartItemDto) {
    const userId = req.user.sub;
    return this.cartService.updateItem(userId, productId, updateDto);
  }

  @Delete('items/:productId')
  async removeItem(@Req() req, @Param('productId') productId: string) {
    const userId = req.user.sub;
    return this.cartService.removeItem(userId, productId);
  }

  @Delete()
  async clearCart(@Req() req) {
    const userId = req.user.sub;
    return this.cartService.clearCart(userId);
  }
}
