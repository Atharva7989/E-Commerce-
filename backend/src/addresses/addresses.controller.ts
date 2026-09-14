import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async getAddresses(@Req() req) {
    const userId = req.user.sub;
    return this.addressesService.getAddresses(userId);
  }

  @Get(':id')
  async getAddressById(@Req() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.addressesService.getAddressById(userId, id);
  }

  @Post()
  async createAddress(@Req() req, @Body() dto: CreateAddressDto) {
    const userId = req.user.sub;
    return this.addressesService.createAddress(userId, dto);
  }

  @Patch(':id')
  async updateAddress(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId = req.user.sub;
    return this.addressesService.updateAddress(userId, id, dto);
  }

  @Delete(':id')
  async deleteAddress(@Req() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.addressesService.deleteAddress(userId, id);
  }
}
