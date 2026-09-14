import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        cartId: cart?.id || null,
        items: [],
        subtotal: 0,
        total: 0,
        canCheckout: false,
        errors: ['Your cart is empty.'],
      };
    }

    const errors: string[] = [];
    const enrichedItems: Array<{
      id: string;
      productId: string;
      name: string;
      price: number;
      imageUrl: string;
      quantity: number;
      stock: number;
      active: boolean;
      lineTotal: number;
      isAvailable: boolean;
      error: string | null;
    }> = [];
    let subtotal = 0;

    for (const item of cart.items) {
      // Re-read product directly from database to get live price, stock, and active status
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.active) {
        errors.push(
          `"${product?.name || 'A product'}" is no longer available.`,
        );
        enrichedItems.push({
          id: item.id,
          productId: item.productId,
          name: product?.name || 'Unavailable Product',
          price: product ? product.price : item.product.price,
          imageUrl: product ? product.imageUrl : item.product.imageUrl,
          quantity: item.quantity,
          stock: product ? product.stock : 0,
          active: false,
          lineTotal: 0,
          isAvailable: false,
          error: 'Item is no longer available.',
        });
        continue;
      }

      const hasSufficientStock = product.stock >= item.quantity;
      if (!hasSufficientStock) {
        if (product.stock === 0) {
          errors.push(`"${product.name}" is out of stock.`);
        } else {
          errors.push(
            `"${product.name}" has only ${product.stock} available in stock (you have ${item.quantity} in cart).`,
          );
        }
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      enrichedItems.push({
        id: item.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        stock: product.stock,
        active: product.active,
        lineTotal,
        isAvailable: hasSufficientStock,
        error: !hasSufficientStock
          ? product.stock === 0
            ? 'Out of stock'
            : `Only ${product.stock} left in stock`
          : null,
      });
    }

    const canCheckout = errors.length === 0 && enrichedItems.length > 0;

    return {
      cartId: cart.id,
      items: enrichedItems,
      subtotal,
      total: subtotal,
      canCheckout,
      errors,
    };
  }

  async validateCheckout(userId: string, addressId?: string) {
    if (!addressId) {
      throw new BadRequestException('Shipping address is required to checkout');
    }

    // Verify address belongs to this user
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Selected address not found or does not belong to your account');
    }

    // Get live summary and check validity
    const summary = await this.getSummary(userId);

    if (!summary.items || summary.items.length === 0) {
      throw new BadRequestException('Cannot proceed: Your cart is empty');
    }

    if (!summary.canCheckout) {
      throw new BadRequestException(summary.errors.join(' '));
    }

    return {
      valid: true,
      address,
      items: summary.items,
      subtotal: summary.subtotal,
      total: summary.total,
      message: 'Checkout preparation validated successfully. Ready for payment in Phase 6.',
    };
  }
}
