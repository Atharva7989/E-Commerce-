import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCodOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.addressId) {
      throw new BadRequestException('Shipping address is required');
    }

    if (dto.paymentMethod !== 'COD') {
      throw new BadRequestException('Only Cash on Delivery (COD) is supported');
    }

    // Verify address exists and belongs to the authenticated user
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found or does not belong to user');
    }

    // Retrieve user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Add products before placing an order.');
    }

    // Execute atomic order creation transaction
    return await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const item of cart.items) {
        // Re-read product directly from database
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.active) {
          throw new BadRequestException(
            `Product "${product?.name || 'Item'}" is no longer active`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Only ${product.stock} available (you requested ${item.quantity}).`,
          );
        }

        // Deduct stock in transaction
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        const unitPrice = product.price;
        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      // Create Order with address and item snapshots
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.CONFIRMED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING,
          totalAmount,
          shippingFullName: address.fullName,
          shippingPhone: address.phone,
          shippingAddressLine1: address.addressLine1,
          shippingAddressLine2: address.addressLine2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.postalCode,
          shippingCountry: address.country,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Clear user's cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
