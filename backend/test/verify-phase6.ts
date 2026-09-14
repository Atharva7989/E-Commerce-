import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function runPhase6Verification() {
  console.log('=== Starting Phase 6 Automated Verification (COD Order Creation) ===');

  // Boot NestJS application on an ephemeral port
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3098);
  console.log('Nest app listening on port 3098');

  const prisma = app.get(PrismaService);
  const baseUrl = 'http://localhost:3098';

  let testProduct: any = null;
  let originalPrice = 0;
  let originalStock = 0;

  try {
    testProduct = await prisma.product.findFirst({ where: { active: true } });
    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'Phase 6 Wireless Mechanical Keyboard',
          description: 'Tactile switches with seamless bluetooth',
          price: 150.0,
          imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
          stock: 20,
          active: true,
        },
      });
    }
    originalPrice = testProduct.price;
    originalStock = testProduct.stock;

    // Reset test product to price 100 and stock 10
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { price: 100.0, stock: 10, active: true },
    });

    // -------------------------------------------------------------
    // 1. Unauthenticated requests return 401
    // -------------------------------------------------------------
    console.log('\n[Test 1] Verifying unauthenticated requests to /orders return 401...');
    const unauthOrdersRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: 'test-id', paymentMethod: 'COD' }),
    });
    if (unauthOrdersRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST /orders, got ${unauthOrdersRes.status}`);
    }
    console.log('✓ 401 Unauthenticated check passed.');

    // -------------------------------------------------------------
    // Register & Login User A and User B
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const emailA = `order_user_a_${timestamp}@example.com`;
    const emailB = `order_user_b_${timestamp}@example.com`;

    console.log('\nRegistering User A and User B...');
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Order User A', email: emailA, password: 'Password123!' }),
    });

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Order User B', email: emailB, password: 'Password123!' }),
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

    if (!cookieA || !cookieB) {
      throw new Error('Failed to retrieve authentication cookies for users');
    }
    console.log('✓ Both users registered and authenticated.');

    // Create delivery address for User A
    const addrResA = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'User A Recipient',
        phone: '+1 555-444-3322',
        addressLine1: '456 Mission Street',
        addressLine2: 'Apt 12B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States',
      }),
    });
    const addressA = await addrResA.json();
    console.log('✓ User A Address created:', addressA.id);

    // -------------------------------------------------------------
    // 2. Reject non-COD payment methods
    // -------------------------------------------------------------
    console.log('\n[Test 2] Verifying non-COD payment method is rejected...');
    const invalidMethodRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'RAZORPAY' }),
    });
    if (invalidMethodRes.status !== 400) {
      throw new Error(`Expected 400 for non-COD payment method, got ${invalidMethodRes.status}`);
    }
    const invalidMethodErr = await invalidMethodRes.json();
    if (!invalidMethodErr.message.includes('Only Cash on Delivery (COD) is supported')) {
      throw new Error(`Unexpected error message for non-COD: ${invalidMethodErr.message}`);
    }
    console.log('✓ Non-COD payment method correctly rejected.');

    // -------------------------------------------------------------
    // 3. Reject order creation with empty cart
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying order creation with empty cart is rejected...');
    const emptyCartRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });
    if (emptyCartRes.status !== 400) {
      throw new Error(`Expected 400 for empty cart order creation, got ${emptyCartRes.status}`);
    }
    console.log('✓ Empty cart order rejected.');

    // -------------------------------------------------------------
    // 4. Address ownership check: User B cannot use User A's address
    // -------------------------------------------------------------
    console.log('\n[Test 4] Verifying User B cannot use User A address...');
    // Put item in User B cart first
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
    });

    const crossAddressRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });
    if (crossAddressRes.status !== 404) {
      throw new Error(`Expected 404 when User B uses User A address, got ${crossAddressRes.status}`);
    }
    console.log('✓ Cross-user address access strictly rejected with 404.');

    // -------------------------------------------------------------
    // 5. Successful COD Order Creation
    // -------------------------------------------------------------
    console.log('\n[Test 5] Placing successful COD Order for User A...');
    // User A adds 2 of testProduct to cart (price: 100.0, stock: 10)
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
    });

    const initialProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const stockBefore = initialProduct!.stock;

    const createOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });

    if (createOrderRes.status !== 201) {
      const errText = await createOrderRes.text();
      throw new Error(`Expected 201 for order creation, got ${createOrderRes.status}: ${errText}`);
    }

    const orderData = await createOrderRes.json();
    console.log('Order created successfully:', {
      orderId: orderData.id,
      status: orderData.status,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      totalAmount: orderData.totalAmount,
      shippingFullName: orderData.shippingFullName,
      shippingPhone: orderData.shippingPhone,
      itemsCount: orderData.items.length,
    });

    // Assertions on Order response
    if (orderData.status !== 'CONFIRMED') {
      throw new Error(`Expected order status CONFIRMED, got ${orderData.status}`);
    }
    if (orderData.paymentMethod !== 'COD') {
      throw new Error(`Expected paymentMethod COD, got ${orderData.paymentMethod}`);
    }
    if (orderData.paymentStatus !== 'PENDING') {
      throw new Error(`Expected paymentStatus PENDING, got ${orderData.paymentStatus}`);
    }
    if (orderData.totalAmount !== 200.0) {
      throw new Error(`Expected totalAmount 200.0, got ${orderData.totalAmount}`);
    }
    if (orderData.shippingFullName !== 'User A Recipient' || orderData.shippingCity !== 'San Francisco') {
      throw new Error('Shipping address snapshot does not match');
    }
    if (orderData.items.length !== 1 || orderData.items[0].quantity !== 2 || orderData.items[0].unitPrice !== 100.0) {
      throw new Error('Order items data incorrect');
    }

    // Verify Stock Deduction in database
    const productAfter = await prisma.product.findUnique({ where: { id: testProduct.id } });
    console.log(`Stock check: was ${stockBefore}, now ${productAfter!.stock}`);
    if (productAfter!.stock !== stockBefore - 2) {
      throw new Error(`Stock was not decremented correctly. Expected ${stockBefore - 2}, got ${productAfter!.stock}`);
    }
    console.log('✓ Stock successfully deducted in database.');

    // Verify User A cart was cleared in database
    const cartAfter = await prisma.cart.findUnique({
      where: { userId: userA.id },
      include: { items: true },
    });
    if (cartAfter && cartAfter.items.length !== 0) {
      throw new Error(`Expected cart items to be cleared, but found ${cartAfter.items.length} items`);
    }
    console.log('✓ User cart successfully cleared in database.');

    // -------------------------------------------------------------
    // 6. Insufficient stock failure & transaction rollback
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing insufficient stock rejection & transaction rollback...');
    // Current stock is 8. Let's set stock to 1
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 1 },
    });

    // User A adds 1 item to cart (within stock at add-time)
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
    });

    // Now reduce stock to 0 in DB before order placement
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 0 },
    });

    const lowStockOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });
    if (lowStockOrderRes.status !== 400) {
      throw new Error(`Expected 400 for order with insufficient stock, got ${lowStockOrderRes.status}`);
    }
    const lowStockErr = await lowStockOrderRes.json();
    if (!lowStockErr.message.includes('Insufficient stock')) {
      throw new Error(`Expected Insufficient stock error message, got: ${lowStockErr.message}`);
    }

    // Verify stock is still 0 and cart item still exists (rollback verified)
    const stockCheckRollback = await prisma.product.findUnique({ where: { id: testProduct.id } });
    if (stockCheckRollback!.stock !== 0) {
      throw new Error(`Stock changed unexpectedly during rollback test: ${stockCheckRollback!.stock}`);
    }
    const cartCheckRollback = await prisma.cart.findUnique({
      where: { userId: userA.id },
      include: { items: true },
    });
    if (!cartCheckRollback || cartCheckRollback.items.length === 0) {
      throw new Error('Cart was cleared even though transaction should have failed and rolled back');
    }
    console.log('✓ Insufficient stock correctly rejected and transaction rolled back.');

    // -------------------------------------------------------------
    // 7. Inactive product failure & transaction rollback
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing inactive product rejection & transaction rollback...');
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 5, active: false },
    });

    const inactiveOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: addressA.id, paymentMethod: 'COD' }),
    });
    if (inactiveOrderRes.status !== 400) {
      throw new Error(`Expected 400 for inactive product order, got ${inactiveOrderRes.status}`);
    }
    const inactiveErr = await inactiveOrderRes.json();
    if (!inactiveErr.message.includes('is no longer active')) {
      throw new Error(`Expected inactive product message, got: ${inactiveErr.message}`);
    }

    // Verify stock did not decrement (still 5)
    const stockAfterInactive = await prisma.product.findUnique({ where: { id: testProduct.id } });
    if (stockAfterInactive!.stock !== 5) {
      throw new Error(`Stock was altered during inactive product transaction failure: ${stockAfterInactive!.stock}`);
    }
    console.log('✓ Inactive product correctly rejected and transaction rolled back.');

    // -------------------------------------------------------------
    // 8. Order Query Endpoints
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing GET /orders and GET /orders/:id...');
    const userAOrdersRes = await fetch(`${baseUrl}/orders`, {
      headers: { Cookie: cookieA },
    });
    if (!userAOrdersRes.ok) {
      throw new Error(`Failed to fetch user orders: ${userAOrdersRes.status}`);
    }
    const userAOrders = await userAOrdersRes.json();
    if (userAOrders.length !== 1 || userAOrders[0].id !== orderData.id) {
      throw new Error(`GET /orders did not return expected order list: count=${userAOrders.length}`);
    }

    const singleOrderRes = await fetch(`${baseUrl}/orders/${orderData.id}`, {
      headers: { Cookie: cookieA },
    });
    if (!singleOrderRes.ok) {
      throw new Error(`Failed to fetch single order: ${singleOrderRes.status}`);
    }
    const singleOrder = await singleOrderRes.json();
    if (singleOrder.id !== orderData.id || singleOrder.items.length !== 1) {
      throw new Error('GET /orders/:id returned invalid order details');
    }

    // User B cannot access User A's order
    const userBCrossOrder = await fetch(`${baseUrl}/orders/${orderData.id}`, {
      headers: { Cookie: cookieB },
    });
    if (userBCrossOrder.status !== 404) {
      throw new Error(`Expected 404 when User B accesses User A's order, got ${userBCrossOrder.status}`);
    }
    console.log('✓ GET /orders and cross-user order security verified.');

    console.log('\n===========================================================');
    console.log('ALL PHASE 6 COD ORDER CREATION VERIFICATIONS PASSED! 🎉');
    console.log('===========================================================');
  } finally {
    // Restore test product to original price, stock, and active status
    if (testProduct) {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { price: originalPrice, stock: originalStock, active: true },
      });
      console.log('Restored test product to original price and stock.');
    }
    await app.close();
  }
}

runPhase6Verification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('PHASE 6 VERIFICATION FAILED:', err);
    process.exit(1);
  });
