import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function runVerification() {
  console.log('--- Starting Phase 5 Automated Verification ---');

  // Boot NestJS application on an ephemeral port
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3099);
  console.log('Nest app listening on port 3099');

  const prisma = app.get(PrismaService);
  const baseUrl = 'http://localhost:3099';

  let testProduct: any = null;
  let originalPrice = 0;
  let originalStock = 0;

  try {
    testProduct = await prisma.product.findFirst({ where: { active: true } });
    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          name: 'Phase 5 Test Item',
          description: 'Testing live checkout & stock verification',
          price: 120.0,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          stock: 10,
          active: true,
        },
      });
    }
    originalPrice = testProduct.price;
    originalStock = testProduct.stock;

    // -------------------------------------------------------------
    // 1. Unauthenticated requests return 401
    // -------------------------------------------------------------
    console.log('\n[Test 1] Verifying unauthenticated requests return 401...');
    const unauthAddrRes = await fetch(`${baseUrl}/addresses`);
    if (unauthAddrRes.status !== 401) {
      throw new Error(`Expected 401 for GET /addresses unauth, got ${unauthAddrRes.status}`);
    }
    const unauthCheckoutRes = await fetch(`${baseUrl}/checkout/summary`);
    if (unauthCheckoutRes.status !== 401) {
      throw new Error(`Expected 401 for GET /checkout/summary unauth, got ${unauthCheckoutRes.status}`);
    }
    const unauthValidateRes = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: 'random' }),
    });
    if (unauthValidateRes.status !== 401) {
      throw new Error(`Expected 401 for POST /checkout/validate unauth, got ${unauthValidateRes.status}`);
    }
    console.log('✓ 401 Unauthenticated checks passed.');

    // -------------------------------------------------------------
    // Register User A and User B
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const emailA = `user_a_${timestamp}@example.com`;
    const emailB = `user_b_${timestamp}@example.com`;

    console.log('\nRegistering User A and User B...');
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: emailA, password: 'Password123!' }),
    });

    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: emailB, password: 'Password123!' }),
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

    // -------------------------------------------------------------
    // 2. Create address for User A (validating phone and postal code)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Creating address with validation...');
    // Test invalid phone
    const badPhoneRes = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'User A',
        phone: '12', // invalid
        addressLine1: '123 Test St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'USA',
      }),
    });
    if (badPhoneRes.status !== 400) {
      throw new Error(`Expected 400 for bad phone number, got ${badPhoneRes.status}`);
    }

    // Test invalid postal code
    const badPostalRes = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'User A',
        phone: '+1 555-123-4567',
        addressLine1: '123 Test St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '!', // invalid
        country: 'USA',
      }),
    });
    if (badPostalRes.status !== 400) {
      throw new Error(`Expected 400 for bad postal code, got ${badPostalRes.status}`);
    }

    // Valid create
    const createRes = await fetch(`${baseUrl}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'User A Real Name',
        phone: '+1 555-987-6543',
        addressLine1: '789 Market Street',
        addressLine2: 'Suite 200',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94103',
        country: 'United States',
      }),
    });
    if (createRes.status !== 201) {
      throw new Error(`Expected 201 for address creation, got ${createRes.status}`);
    }
    const createdAddress = await createRes.json();
    console.log('✓ Address created:', createdAddress.id);
    if (createdAddress.userId !== userA.id) {
      throw new Error(`Address userId ${createdAddress.userId} does not match userA id ${userA.id}`);
    }

    // -------------------------------------------------------------
    // 3. Edit address
    // -------------------------------------------------------------
    console.log('\n[Test 3] Editing address...');
    const editRes = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fullName: 'User A Modified Name',
        city: 'Oakland',
      }),
    });
    if (editRes.status !== 200) {
      throw new Error(`Expected 200 for address update, got ${editRes.status}`);
    }
    const updatedAddress = await editRes.json();
    if (updatedAddress.fullName !== 'User A Modified Name' || updatedAddress.city !== 'Oakland') {
      throw new Error('Address update fields did not reflect correctly');
    }
    console.log('✓ Address updated successfully.');

    // -------------------------------------------------------------
    // 4. User A cannot access User B's address (and vice versa) -> 404
    // -------------------------------------------------------------
    console.log("\n[Test 4] Testing cross-user address isolation (User B accessing User A's address)...");
    const userBGet = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      headers: { Cookie: cookieB },
    });
    if (userBGet.status !== 404) {
      throw new Error(`Expected 404 when User B gets User A address, got ${userBGet.status}`);
    }

    const userBPatch = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ fullName: 'Hacker' }),
    });
    if (userBPatch.status !== 404) {
      throw new Error(`Expected 404 when User B patches User A address, got ${userBPatch.status}`);
    }

    const userBDelete = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    if (userBDelete.status !== 404) {
      throw new Error(`Expected 404 when User B deletes User A address, got ${userBDelete.status}`);
    }

    const userBList = await fetch(`${baseUrl}/addresses`, {
      headers: { Cookie: cookieB },
    });
    const userBAddresses = await userBList.json();
    if (userBAddresses.some((a: any) => a.id === createdAddress.id)) {
      throw new Error("User B's address list contained User A's address!");
    }
    console.log("✓ Cross-user isolation verified: returns 404 and does not leak addresses.");

    // -------------------------------------------------------------
    // 5. Cart items & Checkout preparation
    // -------------------------------------------------------------
    console.log('\n[Test 5] Adding items to User A cart and testing checkout summary...');
    // Set product price to 100.0 and stock to 10
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { price: 100.0, stock: 10, active: true },
    });

    const addCartRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
    });
    if (!addCartRes.ok) {
      throw new Error(`Failed to add item to cart: ${addCartRes.status}`);
    }

    const summaryRes = await fetch(`${baseUrl}/checkout/summary`, {
      headers: { Cookie: cookieA },
    });
    if (!summaryRes.ok) {
      throw new Error(`Failed to fetch checkout summary: ${summaryRes.status}`);
    }
    const summary = await summaryRes.json();
    console.log('Checkout summary received:', {
      itemsCount: summary.items.length,
      subtotal: summary.subtotal,
      total: summary.total,
      canCheckout: summary.canCheckout,
    });

    if (summary.subtotal !== 200.0 || summary.total !== 200.0) {
      throw new Error(`Expected subtotal and total 200.0, got ${summary.subtotal}`);
    }
    if (!summary.canCheckout) {
      throw new Error(`Expected canCheckout to be true, got false. Errors: ${summary.errors}`);
    }

    // Validate checkout with address
    const validateRes = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: createdAddress.id }),
    });
    if (validateRes.status !== 201) {
      throw new Error(`Expected 201 for checkout validate, got ${validateRes.status}`);
    }
    const validateData = await validateRes.json();
    if (!validateData.valid || validateData.total !== 200.0) {
      throw new Error('Checkout validate returned unexpected data');
    }
    console.log('✓ Checkout validated with selected address successfully.');

    // -------------------------------------------------------------
    // 6. Change product price in DB and verify checkout uses current backend values
    // -------------------------------------------------------------
    console.log('\n[Test 6] Changing product price in backend database to 250.0...');
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { price: 250.0 },
    });

    const updatedPriceSummaryRes = await fetch(`${baseUrl}/checkout/summary`, {
      headers: { Cookie: cookieA },
    });
    const updatedPriceSummary = await updatedPriceSummaryRes.json();
    console.log('Updated price checkout summary:', {
      itemPrice: updatedPriceSummary.items[0]?.price,
      lineTotal: updatedPriceSummary.items[0]?.lineTotal,
      subtotal: updatedPriceSummary.subtotal,
      total: updatedPriceSummary.total,
    });
    if (updatedPriceSummary.subtotal !== 500.0 || updatedPriceSummary.total !== 500.0) {
      throw new Error(`Expected subtotal 500.0 after price update, got ${updatedPriceSummary.subtotal}`);
    }
    console.log('✓ Backend price re-read dynamically verified.');

    // -------------------------------------------------------------
    // 7. Insufficient stock prevents checkout
    // -------------------------------------------------------------
    console.log('\n[Test 7] Lowering product stock in DB below cart quantity (stock: 1, requested: 2)...');
    await prisma.product.update({
      where: { id: testProduct.id },
      data: { stock: 1 },
    });

    const lowStockSummaryRes = await fetch(`${baseUrl}/checkout/summary`, {
      headers: { Cookie: cookieA },
    });
    const lowStockSummary = await lowStockSummaryRes.json();
    console.log('Low stock summary check:', {
      canCheckout: lowStockSummary.canCheckout,
      errors: lowStockSummary.errors,
    });
    if (lowStockSummary.canCheckout !== false) {
      throw new Error('Expected canCheckout to be false when stock is insufficient');
    }
    if (!lowStockSummary.errors || lowStockSummary.errors.length === 0) {
      throw new Error('Expected error messages in summary for low stock');
    }

    // Try validating checkout with insufficient stock
    const lowStockValidateRes = await fetch(`${baseUrl}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ addressId: createdAddress.id }),
    });
    if (lowStockValidateRes.status !== 400) {
      throw new Error(`Expected 400 for checkout validate with insufficient stock, got ${lowStockValidateRes.status}`);
    }
    const lowStockErr = await lowStockValidateRes.json();
    console.log('✓ Insufficient stock correctly prevented checkout:', lowStockErr.message);

    // -------------------------------------------------------------
    // 8. Delete address
    // -------------------------------------------------------------
    console.log('\n[Test 8] Deleting address...');
    const deleteRes = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Expected 200 for address deletion, got ${deleteRes.status}`);
    }
    const checkDeleted = await fetch(`${baseUrl}/addresses/${createdAddress.id}`, {
      headers: { Cookie: cookieA },
    });
    if (checkDeleted.status !== 404) {
      throw new Error(`Expected 404 after address deleted, got ${checkDeleted.status}`);
    }
    console.log('✓ Address deleted and verified gone.');

    console.log('\n======================================================');
    console.log('ALL PHASE 5 AUTOMATED VERIFICATION CHECKS PASSED! 🎉');
    console.log('======================================================');
  } finally {
    // Restore product back to original state
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

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  });
