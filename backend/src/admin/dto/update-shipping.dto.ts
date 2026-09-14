export class UpdateShippingDto {
  shippingStatus?: 'NOT_SHIPPED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  courierName?: string;
  trackingNumber?: string;
}
