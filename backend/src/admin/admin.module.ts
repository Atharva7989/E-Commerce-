import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [PrismaModule],
  providers: [AdminService, AdminGuard],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
