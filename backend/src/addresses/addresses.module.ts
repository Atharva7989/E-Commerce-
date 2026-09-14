import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';

@Module({
  imports: [PrismaModule],
  providers: [AddressesService, JwtAuthGuard],
  controllers: [AddressesController],
  exports: [AddressesService],
})
export class AddressesModule {}
