import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');
  
  const products = [
    {
      name: 'Wireless Noise-Canceling Headphones',
      description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.',
      price: 299.99,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      stock: 50,
      active: true,
    },
    {
      name: 'Minimalist Mechanical Keyboard',
      description: 'Compact 75% layout mechanical keyboard with tactile switches, RGB backlighting, and a sleek aluminum chassis.',
      price: 149.50,
      imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
      stock: 30,
      active: true,
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Highly adjustable ergonomic chair with breathable mesh back, lumbar support, and 3D armrests for all-day comfort.',
      price: 499.00,
      imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80',
      stock: 15,
      active: true,
    },
    {
      name: 'Smart Desk Lamp',
      description: 'Adjustable LED desk lamp with wireless charging base, adjustable color temperature, and touch controls.',
      price: 79.99,
      imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&q=80',
      stock: 100,
      active: true,
    }
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      const product = await prisma.product.create({
        data: p,
      });
      console.log(`Created product with id: ${product.id}`);
    }
  }

  // Seed initial ADMIN user
  console.log('Seeding initial admin user...');
  const bcrypt = await import('bcrypt');
  const adminEmail = 'admin@store.com';
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      name: 'Store Admin',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
