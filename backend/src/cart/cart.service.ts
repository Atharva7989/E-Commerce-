import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Product } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart) {
      // create empty cart
      const newCart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
      return { ...newCart, subtotal: 0 };
    }
    // calculate subtotal from current product prices
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    return { ...cart, subtotal };
  }

  async addItem(userId: string, dto: CreateCartItemDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }
    if (dto.quantity < 1 || dto.quantity > product.stock) {
      throw new BadRequestException('Invalid quantity');
    }
    // ensure cart exists
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    // upsert cart item
    return await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      update: { quantity: dto.quantity },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      include: { product: true },
    });
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }
    if (dto.quantity < 1 || dto.quantity > product.stock) {
      throw new BadRequestException('Invalid quantity');
    }
    return await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    return { success: true };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { success: true };
  }

  async mergeCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    if (!items || items.length === 0) {
      return this.getCart(userId);
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) continue;

      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active || product.stock <= 0) continue;

      const existingItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      });

      const currentQty = existingItem ? existingItem.quantity : 0;
      const combinedQty = currentQty + item.quantity;
      const finalQty = Math.min(combinedQty, product.stock);

      if (finalQty <= 0) continue;

      await this.prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
        update: { quantity: finalQty },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: finalQty,
        },
      });
    }

    return this.getCart(userId);
  }
}
