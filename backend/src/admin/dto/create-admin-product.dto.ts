export class CreateAdminProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active?: boolean;
}
