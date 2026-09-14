import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';

async function runVerification() {
  console.log('=== STARTING PHASE 8 VERIFICATION: ADMIN PANEL & RBAC SECURITY ===\n');

  const PORT = 3098;
  const BASE_URL = `http://localhost:${PORT}`;

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  const prisma = app.get(PrismaService);

  try {
    // ----------------------------------------------------
    // Test 1: Public Registration Security Check
    // ----------------------------------------------------
    console.log('\n--- Test 1: Public Registration Security Check ---');
    const attackerEmail = `attacker_${Date.now()}@store.com`;
    const regPayload = {
      name: 'Malicious Attacker',
      email: attackerEmail,
      password: 'AttackerPassword123!',
      role: 'ADMIN', // Attacker maliciously trying to become ADMIN
    };

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });

    if (regRes.status !== 201) {
      throw new Error(`Expected 201 on registration, got ${regRes.status}`);
    }
    const regData = await regRes.json();
    console.log('Registered user response:', regData);

    // Verify in database that role is USER, NOT ADMIN!
    const dbUser = await prisma.user.findUnique({ where: { email: attackerEmail } });
    if (!dbUser) throw new Error('Registered user not found in database');
    if (dbUser.role !== Role.USER) {
      throw new Error(`SECURITY FAILURE: User role is ${dbUser.role}, expected USER!`);
    }
    console.log('✓ Public registration correctly ignored client-provided role and set role = USER');

    // ----------------------------------------------------
    // Test 2: RBAC Authorization Check (401 & 403)
    // ----------------------------------------------------
    console.log('\n--- Test 2: Backend AdminGuard Authorization Check ---');
    // Unauthenticated request to /admin/metrics
    const unauthRes = await fetch(`${BASE_URL}/admin/metrics`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('✓ Unauthenticated request rejected with 401 Unauthorized');

    // Login as the regular user (attacker)
    const attackerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: attackerEmail, password: 'AttackerPassword123!' }),
    });
    const attackerCookies = attackerLoginRes.headers.get('set-cookie') || '';

    // Non-admin tries to access /admin/metrics
    const nonAdminMetricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { Cookie: attackerCookies },
    });
    if (nonAdminMetricsRes.status !== 403) {
      throw new Error(`Expected 403 for non-admin on /admin/metrics, got ${nonAdminMetricsRes.status}`);
    }

    // Non-admin tries to access /admin/products
    const nonAdminProdRes = await fetch(`${BASE_URL}/admin/products`, {
      headers: { Cookie: attackerCookies },
    });
    if (nonAdminProdRes.status !== 403) {
      throw new Error(`Expected 403 for non-admin on /admin/products, got ${nonAdminProdRes.status}`);
    }

    // Non-admin tries to access /admin/orders
    const nonAdminOrdRes = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Cookie: attackerCookies },
    });
    if (nonAdminOrdRes.status !== 403) {
      throw new Error(`Expected 403 for non-admin on /admin/orders, got ${nonAdminOrdRes.status}`);
    }
    console.log('✓ Non-admin requests authoritatively rejected with 403 Forbidden across all /admin endpoints');

    // ----------------------------------------------------
    // Test 3: Admin Authentication & Metrics
    // ----------------------------------------------------
    console.log('\n--- Test 3: Seeded Admin Login & Metrics ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@store.com', password: 'AdminPassword123!' }),
    });

    if (adminLoginRes.status !== 200 && adminLoginRes.status !== 201) {
      throw new Error(`Admin login failed with status ${adminLoginRes.status}`);
    }
    const adminData = await adminLoginRes.json();
    if (adminData.role !== 'ADMIN') {
      throw new Error(`Expected admin user role to be ADMIN, got ${adminData.role}`);
    }
    const adminCookies = adminLoginRes.headers.get('set-cookie') || '';
    console.log('✓ Seeded admin logged in successfully, role = ADMIN');

    const metricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { Cookie: adminCookies },
    });
    if (metricsRes.status !== 200) {
      throw new Error(`Failed to fetch /admin/metrics: ${metricsRes.status}`);
    }
    const metrics = await metricsRes.json();
    console.log('Admin Metrics:', metrics);
    if (typeof metrics.totalProducts !== 'number' || typeof metrics.totalOrders !== 'number') {
      throw new Error('Metrics response format invalid');
    }
    console.log('✓ Admin successfully retrieved dashboard metrics');

    // ----------------------------------------------------
    // Test 4: Admin Product Catalog Management
    // ----------------------------------------------------
    console.log('\n--- Test 4: Admin Product Catalog Management ---');
    // Create new product
    const createProdRes = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookies,
      },
      body: JSON.stringify({
        name: 'Phase 8 Quantum Mechanical Keyboard',
        description: 'RGB Backlit Mechanical Keyboard with Hot-Swappable Switches',
        price: 149.99,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-keyboard',
        active: true,
      }),
    });

    if (createProdRes.status !== 201) {
      const err = await createProdRes.text();
      throw new Error(`Admin product creation failed: ${createProdRes.status} ${err}`);
    }
    const createdProduct = await createProdRes.json();
    console.log('✓ Admin created product:', createdProduct.id, createdProduct.name);

    // Update product
    const updateProdRes = await fetch(`${BASE_URL}/admin/products/${createdProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookies,
      },
      body: JSON.stringify({
        price: 139.99,
        stock: 30,
      }),
    });
    if (updateProdRes.status !== 200) {
      throw new Error(`Admin product update failed: ${updateProdRes.status}`);
    }
    const updatedProduct = await updateProdRes.json();
    if (Number(updatedProduct.price) !== 139.99 || updatedProduct.stock !== 30) {
      throw new Error('Product update did not reflect updated price or stock');
    }
    console.log('✓ Admin updated product price & stock');

    // Deactivate product
    const deactRes = await fetch(`${BASE_URL}/admin/products/${createdProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookies,
      },
      body: JSON.stringify({ active: false }),
    });
    const deactivatedProduct = await deactRes.json();
    if (deactivatedProduct.active !== false) {
      throw new Error('Product deactivation failed');
    }
    console.log('✓ Admin deactivated product');

    // Reactivate for storefront purchase
    await fetch(`${BASE_URL}/admin/products/${createdProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookies,
      },
      body: JSON.stringify({ active: true }),
    });

    // ----------------------------------------------------
    // Test 5: Admin Order Processing & Status Update
    // ----------------------------------------------------
    console.log('\n--- Test 5: Customer Order Placement & Admin Fulfillment ---');
    // Customer adds address
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: attackerCookies,
      },
      body: JSON.stringify({
        fullName: 'Test Customer',
        phone: '1234567890',
        addressLine1: '456 Commercial St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      }),
    });
    const address = await addrRes.json();

    // Customer adds product to cart
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: attackerCookies,
      },
      body: JSON.stringify({
        productId: createdProduct.id,
        quantity: 2,
      }),
    });

    // Customer places order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: attackerCookies,
      },
      body: JSON.stringify({
        addressId: address.id,
        paymentMethod: 'COD',
      }),
    });
    const customerOrder = await orderRes.json();
    console.log('✓ Customer placed order:', customerOrder.id, `Status: ${customerOrder.status}`);

    // Admin fetches all orders
    const adminOrdersRes = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Cookie: adminCookies },
    });
    const allOrders = await adminOrdersRes.json();
    const foundOrder = allOrders.find((o: any) => o.id === customerOrder.id);
    if (!foundOrder) {
      throw new Error('Admin orders list did not contain customer order');
    }
    console.log('✓ Admin retrieved orders list containing newly placed customer order');

    // Admin fetches single order details
    const adminOrderDetailRes = await fetch(`${BASE_URL}/admin/orders/${customerOrder.id}`, {
      headers: { Cookie: adminCookies },
    });
    const adminOrderDetail = await adminOrderDetailRes.json();
    if (!adminOrderDetail.shippingAddressSnapshot || adminOrderDetail.items.length === 0) {
      throw new Error('Admin order detail missing snapshot or items');
    }
    console.log('✓ Admin retrieved full order snapshot and item breakdown');

    // Admin updates order status to DELIVERED
    const updateStatusRes = await fetch(`${BASE_URL}/admin/orders/${customerOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookies,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    if (updateStatusRes.status !== 200) {
      throw new Error(`Admin status update failed: ${updateStatusRes.status}`);
    }
    const deliveredOrder = await updateStatusRes.json();
    if (deliveredOrder.status !== 'DELIVERED') {
      throw new Error(`Expected DELIVERED status, got ${deliveredOrder.status}`);
    }
    console.log('✓ Admin updated order status to DELIVERED');

    // Customer checks their order
    const custCheckRes = await fetch(`${BASE_URL}/orders/${customerOrder.id}`, {
      headers: { Cookie: attackerCookies },
    });
    const custCheck = await custCheckRes.json();
    if (custCheck.status !== 'DELIVERED') {
      throw new Error(`Customer sees status ${custCheck.status}, expected DELIVERED`);
    }
    if (Number(custCheck.totalAmount) !== Number(customerOrder.totalAmount)) {
      throw new Error('Integrity violation: Order total amount was altered!');
    }
    console.log('✓ Customer confirmed order status updated to DELIVERED with unchanged totalAmount');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 8 ADMIN & RBAC VERIFICATION TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    await app.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
