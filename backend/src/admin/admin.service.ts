import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { OrderStatus, ShippingStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // Dashboard Metrics
  // -------------------------------------------------------------
  async getDashboardMetrics() {
    const totalProducts = await this.prisma.product.count();
    const activeProducts = await this.prisma.product.count({
      where: { active: true },
    });
    const totalOrders = await this.prisma.order.count();
    const pendingOrders = await this.prisma.order.count({
      where: { status: OrderStatus.PENDING },
    });

    const salesAggregate = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
    });

    const totalSales = salesAggregate._sum.totalAmount || 0;

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalSales,
    };
  }

  // -------------------------------------------------------------
  // Product Catalog Management
  // -------------------------------------------------------------
  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(dto: CreateAdminProductDto) {
    if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length < 2) {
      throw new BadRequestException('Product name must be at least 2 characters long');
    }
    if (!dto.description || typeof dto.description !== 'string' || dto.description.trim().length < 5) {
      throw new BadRequestException('Product description must be at least 5 characters long');
    }
    const price = Number(dto.price);
    if (isNaN(price) || price <= 0) {
      throw new BadRequestException('Price must be a positive number');
    }
    if (!dto.imageUrl || typeof dto.imageUrl !== 'string' || dto.imageUrl.trim().length < 5) {
      throw new BadRequestException('A valid image URL is required');
    }
    const stock = Number(dto.stock);
    if (isNaN(stock) || stock < 0) {
      throw new BadRequestException('Stock must be a non-negative integer');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
        price,
        imageUrl: dto.imageUrl.trim(),
        stock: Math.floor(stock),
        active: dto.active !== undefined ? Boolean(dto.active) : true,
      },
    });
  }

  async updateProduct(id: string, dto: UpdateAdminProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const dataToUpdate: any = {};

    if (dto.name !== undefined) {
      if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length < 2) {
        throw new BadRequestException('Product name must be at least 2 characters long');
      }
      dataToUpdate.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      if (!dto.description || typeof dto.description !== 'string' || dto.description.trim().length < 5) {
        throw new BadRequestException('Product description must be at least 5 characters long');
      }
      dataToUpdate.description = dto.description.trim();
    }

    if (dto.price !== undefined) {
      const price = Number(dto.price);
      if (isNaN(price) || price <= 0) {
        throw new BadRequestException('Price must be a positive number');
      }
      dataToUpdate.price = price;
    }

    if (dto.imageUrl !== undefined) {
      if (!dto.imageUrl || typeof dto.imageUrl !== 'string' || dto.imageUrl.trim().length < 5) {
        throw new BadRequestException('A valid image URL is required');
      }
      dataToUpdate.imageUrl = dto.imageUrl.trim();
    }

    if (dto.stock !== undefined) {
      const stock = Number(dto.stock);
      if (isNaN(stock) || stock < 0) {
        throw new BadRequestException('Stock must be a non-negative integer');
      }
      dataToUpdate.stock = Math.floor(stock);
    }

    if (dto.active !== undefined) {
      dataToUpdate.active = Boolean(dto.active);
    }

    return this.prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        cartItems: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // If product has been ordered, deactivate to preserve order history
    if (existing.orderItems && existing.orderItems.length > 0) {
      const updated = await this.prisma.product.update({
        where: { id },
        data: { active: false },
      });
      return {
        success: true,
        message: 'Product is referenced by orders and was deactivated rather than deleted.',
        product: updated,
      };
    }

    // Otherwise clean up cart items if any and delete
    if (existing.cartItems && existing.cartItems.length > 0) {
      await this.prisma.cartItem.deleteMany({ where: { productId: id } });
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Product deleted successfully.',
    };
  }

  // -------------------------------------------------------------
  // Order Management
  // -------------------------------------------------------------
  async getOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      shippingAddressSnapshot: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
    };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const validStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED,
      OrderStatus.DELIVERED,
    ];

    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only update status - historical item prices, totals, and address snapshots remain untouched
    const statusData: any = { status: dto.status };
    if (dto.status === OrderStatus.DELIVERED) {
      statusData.shippingStatus = ShippingStatus.DELIVERED;
      if (!order.deliveredAt) {
        statusData.deliveredAt = new Date();
      }
      if (!order.shippedAt) {
        statusData.shippedAt = new Date();
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: statusData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      ...updated,
      shippingAddressSnapshot: {
        fullName: updated.shippingFullName,
        phone: updated.shippingPhone,
        addressLine1: updated.shippingAddressLine1,
        addressLine2: updated.shippingAddressLine2,
        city: updated.shippingCity,
        state: updated.shippingState,
        postalCode: updated.shippingPostalCode,
        country: updated.shippingCountry,
      },
    };
  }

  async updateShipping(id: string, dto: UpdateShippingDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const dataToUpdate: any = {};

    if (dto.courierName !== undefined) {
      dataToUpdate.courierName = dto.courierName?.trim() || null;
    }

    if (dto.trackingNumber !== undefined) {
      dataToUpdate.trackingNumber = dto.trackingNumber?.trim() || null;
    }

    if (dto.shippingStatus !== undefined) {
      const validStatuses = [
        ShippingStatus.NOT_SHIPPED,
        ShippingStatus.SHIPPED,
        ShippingStatus.OUT_FOR_DELIVERY,
        ShippingStatus.DELIVERED,
      ];

      if (!validStatuses.includes(dto.shippingStatus as ShippingStatus)) {
        throw new BadRequestException(
          `Invalid shipping status. Must be one of: ${validStatuses.join(', ')}`,
        );
      }

      dataToUpdate.shippingStatus = dto.shippingStatus;

      // Automatically set shippedAt if transitioning to SHIPPED or beyond and shippedAt is null
      if (
        (dto.shippingStatus === ShippingStatus.SHIPPED ||
          dto.shippingStatus === ShippingStatus.OUT_FOR_DELIVERY ||
          dto.shippingStatus === ShippingStatus.DELIVERED) &&
        !order.shippedAt
      ) {
        dataToUpdate.shippedAt = new Date();
      }

      // Automatically set deliveredAt and sync order.status when transitioning to DELIVERED
      if (dto.shippingStatus === ShippingStatus.DELIVERED) {
        if (!order.deliveredAt) {
          dataToUpdate.deliveredAt = new Date();
        }
        dataToUpdate.status = OrderStatus.DELIVERED;
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      ...updated,
      shippingAddressSnapshot: {
        fullName: updated.shippingFullName,
        phone: updated.shippingPhone,
        addressLine1: updated.shippingAddressLine1,
        addressLine2: updated.shippingAddressLine2,
        city: updated.shippingCity,
        state: updated.shippingState,
        postalCode: updated.shippingPostalCode,
        country: updated.shippingCountry,
      },
    };
  }
}
