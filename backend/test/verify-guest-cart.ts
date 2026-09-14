import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function runGuestCartVerification() {
  console.log('=== STARTING GUEST SHOPPING FLOW & CART MERGE VERIFICATION ===\n');

  const PORT = 3099;
  const BASE_URL = `http://localhost:${PORT}`;

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  const prisma = app.get(PrismaService);

  try {
    // Fetch 2 active products for testing
    const products = await prisma.product.findMany({
      where: { active: true, stock: { gte: 5 } },
      take: 2,
    });

    if (products.length < 2) {
      throw new Error('Need at least 2 active products in DB with stock >= 5 for testing');
    }

    const [prodA, prodB] = products;
    console.log(`Using Product A: ${prodA.name} ($${prodA.price}, Stock: ${prodA.stock})`);
    console.log(`Using Product B: ${prodB.name} ($${prodB.price}, Stock: ${prodB.stock})`);

    // ----------------------------------------------------
    // Test 1: Unauthenticated Protection Checks (401)
    // ----------------------------------------------------
    console.log('\n--- Test 1: Unauthenticated Protections ---');
    const unauthOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: 'random-address', paymentMethod: 'COD' }),
    });
    if (unauthOrderRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST /orders, got ${unauthOrderRes.status}`);
    }
    console.log('✓ Unauthenticated POST /orders correctly rejected with 401 Unauthorized');

    const unauthSummaryRes = await fetch(`${BASE_URL}/checkout/summary`);
    if (unauthSummaryRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated GET /checkout/summary, got ${unauthSummaryRes.status}`);
    }
    console.log('✓ Unauthenticated GET /checkout/summary correctly rejected with 401 Unauthorized');

    const unauthMergeRes = await fetch(`${BASE_URL}/cart/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: prodA.id, quantity: 1 }] }),
    });
    if (unauthMergeRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST /cart/merge, got ${unauthMergeRes.status}`);
    }
    console.log('✓ Unauthenticated POST /cart/merge correctly rejected with 401 Unauthorized');

    // ----------------------------------------------------
    // Test 2: User Registration & Login
    // ----------------------------------------------------
    console.log('\n--- Test 2: Register & Authenticate Customer ---');
    const email = `guest_user_${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Guest Converter', email, password: 'Password123!' }),
    });

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });

    const cookie = loginRes.headers.get('set-cookie') || '';
    if (!cookie) throw new Error('Failed to obtain auth cookie');
    console.log('✓ Customer registered and logged in successfully');

    // ----------------------------------------------------
    // Test 3: Merge Guest Cart Items Into Account
    // ----------------------------------------------------
    console.log('\n--- Test 3: Merging Guest Items into Account Cart ---');
    // Guest had 2 of Prod A and 1 of Prod B in localStorage
    const guestItems = [
      { productId: prodA.id, quantity: 2 },
      { productId: prodB.id, quantity: 1 },
    ];

    const mergeRes = await fetch(`${BASE_URL}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ items: guestItems }),
    });

    if (mergeRes.status !== 201 && mergeRes.status !== 200) {
      throw new Error(`Expected 200/201 on cart merge, got ${mergeRes.status}`);
    }
    const mergedCart = await mergeRes.json();
    console.log('Merged cart items count:', mergedCart.items.length);
    if (mergedCart.items.length !== 2) {
      throw new Error(`Expected 2 items in merged cart, got ${mergedCart.items.length}`);
    }

    const itemA = mergedCart.items.find((i: any) => i.productId === prodA.id);
    const itemB = mergedCart.items.find((i: any) => i.productId === prodB.id);
    if (!itemA || itemA.quantity !== 2) {
      throw new Error(`Product A quantity in cart mismatch: expected 2, got ${itemA?.quantity}`);
    }
    if (!itemB || itemB.quantity !== 1) {
      throw new Error(`Product B quantity in cart mismatch: expected 1, got ${itemB?.quantity}`);
    }

    const expectedSubtotal = prodA.price * 2 + prodB.price * 1;
    if (Math.abs(mergedCart.subtotal - expectedSubtotal) > 0.01) {
      throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${mergedCart.subtotal}`);
    }
    console.log('✓ Guest cart successfully merged into customer database cart with correct subtotal');

    // ----------------------------------------------------
    // Test 4: Merging with existing items in cart (summing)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Merging Additional Quantity with Existing Cart Items ---');
    // Simulate another guest addition of Prod A (qty 1)
    const mergeAgainRes = await fetch(`${BASE_URL}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ items: [{ productId: prodA.id, quantity: 1 }] }),
    });

    const mergedAgainCart = await mergeAgainRes.json();
    const itemAAgain = mergedAgainCart.items.find((i: any) => i.productId === prodA.id);
    if (!itemAAgain || itemAAgain.quantity !== 3) {
      throw new Error(`Expected Product A quantity to increase to 3, got ${itemAAgain?.quantity}`);
    }
    console.log('✓ Subsequent merge summed quantities accurately (was 2, now 3)');

    // ----------------------------------------------------
    // Test 5: Stock Capping on Merge
    // ----------------------------------------------------
    console.log('\n--- Test 5: Stock Capping on Merge ---');
    const mergeExcessRes = await fetch(`${BASE_URL}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ items: [{ productId: prodB.id, quantity: 9999 }] }),
    });
    const excessCart = await mergeExcessRes.json();
    const itemBExcess = excessCart.items.find((i: any) => i.productId === prodB.id);
    if (!itemBExcess || itemBExcess.quantity !== prodB.stock) {
      throw new Error(`Expected quantity to cap at stock ${prodB.stock}, got ${itemBExcess?.quantity}`);
    }
    console.log(`✓ Excess quantity safely capped at available stock (${prodB.stock})`);

    // ----------------------------------------------------
    // Test 6: Order Placement with Merged Cart
    // ----------------------------------------------------
    console.log('\n--- Test 6: Customer Checkout & Order Creation with Merged Cart ---');
    // Set quantities to safe amounts
    await fetch(`${BASE_URL}/cart/items/${prodA.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ quantity: 1 }),
    });
    await fetch(`${BASE_URL}/cart/items/${prodB.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ quantity: 1 }),
    });

    // Add address
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        fullName: 'Jane Doe',
        phone: '9876543210',
        addressLine1: '789 Guest Avenue',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'USA',
      }),
    });
    const address = await addrRes.json();

    // Place COD Order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ addressId: address.id, paymentMethod: 'COD' }),
    });

    if (orderRes.status !== 201) {
      throw new Error(`Order placement failed: ${orderRes.status}`);
    }
    const order = await orderRes.json();
    console.log('✓ Order placed successfully:', order.id, `Status: ${order.status}`);

    // Verify cart is cleared after order
    const finalCartRes = await fetch(`${BASE_URL}/cart`, {
      headers: { Cookie: cookie },
    });
    const finalCart = await finalCartRes.json();
    if (finalCart.items.length !== 0) {
      throw new Error(`Expected cart to be empty after order, found ${finalCart.items.length} items`);
    }
    console.log('✓ Cart automatically cleared in database after order placement');

    console.log('\n=============================================================');
    console.log('🎉 ALL GUEST CART & MERGE FLOW VERIFICATIONS PASSED!');
    console.log('=============================================================\n');
  } finally {
    await app.close();
  }
}

runGuestCartVerification().catch((err) => {
  console.error('\n❌ GUEST CART VERIFICATION FAILED:', err);
  process.exit(1);
});
