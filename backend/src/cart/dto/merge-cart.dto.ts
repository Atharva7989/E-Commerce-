export class MergeCartItemDto {
  productId: string;
  quantity: number;
}

export class MergeCartDto {
  items: MergeCartItemDto[];
}
