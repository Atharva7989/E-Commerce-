-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('NOT_SHIPPED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'NOT_SHIPPED',
ADD COLUMN     "trackingNumber" TEXT;
