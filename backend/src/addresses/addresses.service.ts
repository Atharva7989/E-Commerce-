import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateFields(dto: Partial<CreateAddressDto>, isUpdate = false) {
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

    if (!isUpdate || dto.fullName !== undefined) {
      if (!dto.fullName || typeof dto.fullName !== 'string' || dto.fullName.trim().length < 2) {
        throw new BadRequestException('Full name must be at least 2 characters long');
      }
    }

    if (!isUpdate || dto.phone !== undefined) {
      if (!dto.phone || typeof dto.phone !== 'string' || !phoneRegex.test(dto.phone.trim())) {
        throw new BadRequestException('Please provide a valid phone number (7-20 digits)');
      }
    }

    if (!isUpdate || dto.addressLine1 !== undefined) {
      if (!dto.addressLine1 || typeof dto.addressLine1 !== 'string' || dto.addressLine1.trim().length < 3) {
        throw new BadRequestException('Address line 1 must be at least 3 characters long');
      }
    }

    if (dto.addressLine2 !== undefined && dto.addressLine2 !== null) {
      if (typeof dto.addressLine2 !== 'string') {
        throw new BadRequestException('Address line 2 must be a string');
      }
    }

    if (!isUpdate || dto.city !== undefined) {
      if (!dto.city || typeof dto.city !== 'string' || dto.city.trim().length < 2) {
        throw new BadRequestException('City is required');
      }
    }

    if (!isUpdate || dto.state !== undefined) {
      if (!dto.state || typeof dto.state !== 'string' || dto.state.trim().length < 2) {
        throw new BadRequestException('State is required');
      }
    }

    if (!isUpdate || dto.postalCode !== undefined) {
      if (!dto.postalCode || typeof dto.postalCode !== 'string' || !postalRegex.test(dto.postalCode.trim())) {
        throw new BadRequestException('Please provide a valid postal code (3-10 alphanumeric characters)');
      }
    }

    if (!isUpdate || dto.country !== undefined) {
      if (!dto.country || typeof dto.country !== 'string' || dto.country.trim().length < 2) {
        throw new BadRequestException('Country is required');
      }
    }
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAddressById(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    this.validateFields(dto, false);

    return this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2 ? dto.addressLine2.trim() : null,
        city: dto.city.trim(),
        state: dto.state.trim(),
        postalCode: dto.postalCode.trim(),
        country: dto.country.trim(),
      },
    });
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    this.validateFields(dto, true);

    const dataToUpdate: any = {};
    if (dto.fullName !== undefined) dataToUpdate.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) dataToUpdate.phone = dto.phone.trim();
    if (dto.addressLine1 !== undefined) dataToUpdate.addressLine1 = dto.addressLine1.trim();
    if (dto.addressLine2 !== undefined) {
      dataToUpdate.addressLine2 = dto.addressLine2 ? dto.addressLine2.trim() : null;
    }
    if (dto.city !== undefined) dataToUpdate.city = dto.city.trim();
    if (dto.state !== undefined) dataToUpdate.state = dto.state.trim();
    if (dto.postalCode !== undefined) dataToUpdate.postalCode = dto.postalCode.trim();
    if (dto.country !== undefined) dataToUpdate.country = dto.country.trim();

    return this.prisma.address.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async deleteAddress(userId: string, id: string) {
    const existing = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id },
    });

    return { success: true, message: 'Address deleted successfully' };
  }
}
