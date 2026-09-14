import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function runPhase7Verification() {
  console.log('=== Starting Phase 7 Automated Verification (My Orders & Order Details) ===');

  // Boot NestJS application on an ephemeral port
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3097);
  console.log('Nest app listening on port 3097');

  const prisma = app.get(PrismaService);
  const baseUrl = 'http://localhost:3097';

  let testProduct: any = null;
  let originalPrice = 0;
  let originalStock = 0;

  try {
    testProduct = await prisma.product.findFirst({ where: { active: true } });
    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'Phase 7 Wireless Noise-Cancelling Earbuds',
          description: 'High fidelity audio with active noise cancellation',
          price: 180.0,
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
          stock: 30,
          active: true,
        },
      });
    }
    originalPrice = testProduct.price;
    originalStock = testProduct.stock;

    // Reset test product to price 180 and stock 30
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { price: 180.0, stock: 30, active: true },
    });

    // -------------------------------------------------------------
    // 1. Unauthenticated requests return 401
    // -------------------------------------------------------------
    console.log('\n[Test 1] Verifying unauthenticated requests to /orders and /orders/:id return 401...');
    const unauthListRes = await fetch(`${baseUrl}/orders`);
    if (unauthListRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /orders, got ${unauthListRes.status}`);
    }

    const unauthDetailRes = await fetch(`${baseUrl}/orders/some-random-id`);
    if (unauthDetailRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /orders/:id, got ${unauthDetailRes.status}`);
    }
    console.log('✓ 401 Unauthenticated checks passed.');

    // -------------------------------------------------------------
    // Register & Login Users (User A, User B, and User C for empty state)
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const emailA = `order_history_a_${timestamp}@example.com`;
    const emailB = `order_history_b_${timestamp}@example.com`;
    const emailC = `order_history_c_${timestamp}@example.com`;

    console.log('\nRegistering User A, User B, and User C...');
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'History User A', email: emailA, password: 'Password123!' }),
    });

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'History User B', email: emailB, password: 'Password123!' }),
    });

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'History User C', email: emailC, password: 'Password123!' }),
    });

    // Login User A
    const loginARes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'Password123!' }),
    });
    const cookieA = loginARes.headers.get('set-cookie');
    const userA = await loginARes.json();

    // Login User B
    const loginBRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: 'Password123!' }),
    });
    const cookieB = loginBRes.headers.get('set-cookie');
    const userB = await loginBRes.json();

    // Login User C (has no orders)
    const loginCRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailC, password: 'Password123!' }),
    });
    const cookieC = loginCRes.headers.get('set-cookie');
    const userC = await loginCRes.json();

    if (!cookieA || !cookieB || !cookieC) {
      throw new Error('Failed to retrieve authentication cookies');
    }
    console.log('✓ All users registered and authenticated.');

    // -------------------------------------------------------------
    // 2. Empty order history works correctly
    // -------------------------------------------------------------
    console.log('\n[Test 2] Verifying empty order history for User C...');
    const emptyOrdersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Cookie: cookieC },
    });
    if (emptyOrdersRes.status !== 200) {
      throw new Error(`Expected 200 for empty order history, got ${emptyOrdersRes.status}`);
    }
    const emptyOrders = await emptyOrdersRes.json();
    if (!Array.isArray(emptyOrders) || emptyOrders.length !== 0) {
      throw new Error(`Expected empty array [], got ${JSON.stringify(emptyOrders)}`);
    }
    console.log('✓ Empty order history returns empty array [].');

    // -------------------------------------------------------------
    // Create Address and Place COD Order for User A
    // -------------------------------------------------------------
    console.log('\nCreating delivery address and placing COD order for User A...');
    const addrResA = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'Alice Walker',
        phone: '+1 555-777-8899',
        addressLine1: '100 Sunset Boulevard',
        addressLine2: 'Penthouse 4',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90028',
        country: 'United States',
      }),
    });
    const addressA = await addrResA.json();

    // User A adds 2 items to cart
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
    });

    // User A places COD order
    const orderCreateRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });
    if (orderCreateRes.status !== 201) {
      throw new Error(`Failed to create order for User A: ${orderCreateRes.status}`);
    }
    const createdOrderA = await orderCreateRes.json();
    console.log('✓ User A created Order:', createdOrderA.id);

    // -------------------------------------------------------------
    // 3. User can see their own orders (GET /orders)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying User A can see their own orders...');
    const userAListRes = await fetch(`${baseUrl}/orders`, {
      headers: { Cookie: cookieA },
    });
    if (userAListRes.status !== 200) {
      throw new Error(`Expected 200 for User A orders, got ${userAListRes.status}`);
    }
    const userAOrders = await userAListRes.json();
    if (!Array.isArray(userAOrders) || userAOrders.length !== 1) {
      throw new Error(`Expected 1 order in User A history, got ${userAOrders.length}`);
    }
    const fetchedOrder = userAOrders[0];
    if (fetchedOrder.id !== createdOrderA.id) {
      throw new Error(`Order ID mismatch in list: expected ${createdOrderA.id}, got ${fetchedOrder.id}`);
    }
    if (fetchedOrder.totalAmount !== 360.0) {
      throw new Error(`Expected totalAmount 360.0 (2 * 180.0), got ${fetchedOrder.totalAmount}`);
    }
    if (fetchedOrder.status !== 'CONFIRMED' || fetchedOrder.paymentMethod !== 'COD') {
      throw new Error('Order status or paymentMethod mismatch');
    }
    if (fetchedOrder.items.length !== 1 || fetchedOrder.items[0].productName !== testProduct.name) {
      throw new Error('Items array in order list incorrect');
    }
    console.log('✓ User A successfully retrieved order list with all fields.');

    // -------------------------------------------------------------
    // 4. Order Details display correct snapshots and totals (GET /orders/:id)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Verifying Order Details (GET /orders/:id) returns exact snapshots...');
    const detailRes = await fetch(`${baseUrl}/orders/${createdOrderA.id}`, {
      headers: { Cookie: cookieA },
    });
    if (detailRes.status !== 200) {
      throw new Error(`Expected 200 for GET /orders/:id, got ${detailRes.status}`);
    }
    const detailData = await detailRes.json();

    // Verify snapshot fields
    if (detailData.shippingFullName !== 'Alice Walker') {
      throw new Error(`Shipping name snapshot mismatch: ${detailData.shippingFullName}`);
    }
    if (detailData.shippingAddressLine1 !== '100 Sunset Boulevard') {
      throw new Error(`Shipping addressLine1 mismatch: ${detailData.shippingAddressLine1}`);
    }
    if (detailData.shippingCity !== 'Los Angeles' || detailData.shippingPostalCode !== '90028') {
      throw new Error(`Shipping city/postalCode mismatch: ${detailData.shippingCity}`);
    }
    if (detailData.shippingPhone !== '+1 555-777-8899') {
      throw new Error(`Shipping phone mismatch: ${detailData.shippingPhone}`);
    }

    // Verify item snapshots and product relation
    const detailItem = detailData.items[0];
    if (detailItem.productName !== testProduct.name) {
      throw new Error(`Item productName snapshot mismatch: ${detailItem.productName}`);
    }
    if (detailItem.unitPrice !== 180.0 || detailItem.quantity !== 2 || detailItem.subtotal !== 360.0) {
      throw new Error(`Item unitPrice/subtotal mismatch: ${detailItem.unitPrice} / ${detailItem.subtotal}`);
    }
    if (!detailItem.product || !detailItem.product.imageUrl) {
      throw new Error('Product relation or imageUrl missing from order items');
    }
    console.log('✓ Order details snapshot verified accurately.');

    // -------------------------------------------------------------
    // 5. User cannot see another user's order (Cross-user isolation)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Verifying User B cannot access User A order...');
    // User B list should not include User A's order
    const userBListRes = await fetch(`${baseUrl}/orders`, {
      headers: { Cookie: cookieB },
    });
    const userBOrders = await userBListRes.json();
    if (userBOrders.some((o: any) => o.id === createdOrderA.id)) {
      throw new Error("User B's order list contained User A's order!");
    }

    // User B direct access to User A's order should return 404
    const userBCrossRes = await fetch(`${baseUrl}/orders/${createdOrderA.id}`, {
      headers: { Cookie: cookieB },
    });
    if (userBCrossRes.status !== 404) {
      throw new Error(`Expected 404 when User B accesses User A order, got ${userBCrossRes.status}`);
    }
    console.log("✓ Cross-user order isolation verified: User B cannot access User A's order (returns 404).");

    // -------------------------------------------------------------
    // 6. Invalid / non-existent order returns 404
    // -------------------------------------------------------------
    console.log('\n[Test 6] Verifying non-existent order returns 404...');
    const nonExistentRes = await fetch(`${baseUrl}/orders/00000000-0000-0000-0000-000000000000`, {
      headers: { Cookie: cookieA },
    });
    if (nonExistentRes.status !== 404) {
      throw new Error(`Expected 404 for non-existent order ID, got ${nonExistentRes.status}`);
    }
    console.log('✓ Non-existent order returns 404.');

    // -------------------------------------------------------------
    // 7. Verify read endpoints do not modify stock or order status
    // -------------------------------------------------------------
    console.log('\n[Test 7] Verifying read endpoints do not modify database stock or orders...');
    const productAfterReads = await prisma.product.findUnique({ where: { id: testProduct.id } });
    if (productAfterReads!.stock !== 28) {
      // Was 30, decremented by 2 during User A's order creation, should still be 28
      throw new Error(`Stock changed during read operations! Expected 28, got ${productAfterReads!.stock}`);
    }
    console.log('✓ Database integrity preserved during read operations.');

    console.log('\n============================================================');
    console.log('ALL PHASE 7 MY ORDERS & DETAILS VERIFICATIONS PASSED! 🎉');
    console.log('============================================================');
  } finally {
    // Restore product back to original state
    if (testProduct) {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { price: originalPrice, stock: originalStock, active: true },
      });
      console.log('Restored test product to original state.');
    }
    await app.close();
  }
}

runPhase7Verification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('PHASE 7 VERIFICATION FAILED:', err);
    process.exit(1);
  });
