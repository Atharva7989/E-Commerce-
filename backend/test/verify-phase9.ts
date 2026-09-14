import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ShippingStatus, OrderStatus } from '@prisma/client';

async function runVerification() {
  console.log('=== STARTING PHASE 9 VERIFICATION: SHIPPING & DELIVERY ===\n');

  const PORT = 3099;
  const BASE_URL = `http://localhost:${PORT}`;

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  const prisma = app.get(PrismaService);

  try {
    // ----------------------------------------------------
    // Setup: Admin & Customer Accounts
    // ----------------------------------------------------
    console.log('\n--- Setup: Admin Login & Customer Registration ---');

    // Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@store.com', password: 'AdminPassword123!' }),
    });
    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    }
    const adminCookies = adminLoginRes.headers.get('set-cookie') || '';
    console.log('✓ Admin authenticated successfully');

    // Register Customer 1
    const customerEmail = `customer_p9_${Date.now()}@store.com`;
    const custRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 9 Customer',
        email: customerEmail,
        password: 'Password123!',
      }),
    });
    if (!custRegRes.ok) throw new Error('Customer registration failed');

    const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: 'Password123!' }),
    });
    const customerCookies = custLoginRes.headers.get('set-cookie') || '';
    console.log('✓ Customer 1 authenticated successfully');

    // Register Customer 2 (for cross-user isolation checks)
    const customer2Email = `customer2_p9_${Date.now()}@store.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Customer',
        email: customer2Email,
        password: 'Password123!',
      }),
    });
    const cust2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customer2Email, password: 'Password123!' }),
    });
    const customer2Cookies = cust2LoginRes.headers.get('set-cookie') || '';
    console.log('✓ Customer 2 authenticated successfully');

    // Setup Product & Address
    const product = await prisma.product.create({
      data: {
        name: 'Logitech MX Master 3S Wireless Mouse',
        description: 'Performance wireless ergonomic mouse',
        price: 99.99,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-mouse',
        active: true,
      },
    });

    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({
        fullName: 'Phase 9 Test Recipient',
        phone: '9876543210',
        addressLine1: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
      }),
    });
    const address = await addrRes.json();

    // Customer Adds Item to Cart & Places Order
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({
        addressId: address.id,
        paymentMethod: 'COD',
      }),
    });
    if (orderRes.status !== 201) {
      const err = await orderRes.text();
      throw new Error(`Order placement failed: ${orderRes.status} ${err}`);
    }
    const order = await orderRes.json();
    console.log('✓ Customer placed COD order:', order.id);

    // Verify initial shippingStatus is NOT_SHIPPED
    if (order.shippingStatus !== 'NOT_SHIPPED') {
      throw new Error(`Expected initial shippingStatus to be NOT_SHIPPED, got ${order.shippingStatus}`);
    }
    if (order.courierName !== null || order.trackingNumber !== null) {
      throw new Error('Initial courierName and trackingNumber must be null');
    }
    console.log('✓ Order initialized with shippingStatus = NOT_SHIPPED');

    // ----------------------------------------------------
    // Test 1: Security Authorization on PATCH /admin/orders/:id/shipping
    // ----------------------------------------------------
    console.log('\n--- Test 1: Security & Authorization on Shipping Endpoints ---');

    // Unauthenticated
    const unauthRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingStatus: 'SHIPPED' }),
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated shipping update, got ${unauthRes.status}`);
    }
    console.log('✓ Unauthenticated shipping update rejected with 401 Unauthorized');

    // Customer (non-admin) attempt
    const nonAdminRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({ shippingStatus: 'SHIPPED' }),
    });
    if (nonAdminRes.status !== 403) {
      throw new Error(`Expected 403 for non-admin shipping update, got ${nonAdminRes.status}`);
    }
    console.log('✓ Customer attempt to modify shipping rejected with 403 Forbidden');

    // Invalid shipping status validation
    const invalidStatusRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ shippingStatus: 'INVALID_STATUS_VALUE' }),
    });
    if (invalidStatusRes.status !== 400) {
      throw new Error(`Expected 400 for invalid shippingStatus enum, got ${invalidStatusRes.status}`);
    }
    console.log('✓ Invalid shippingStatus enum correctly rejected with 400 Bad Request');

    // ----------------------------------------------------
    // Test 2: Admin Updates Shipping to SHIPPED with Tracking
    // ----------------------------------------------------
    console.log('\n--- Test 2: Admin Updates Shipping to SHIPPED with Courier & Tracking ---');
    const updateShippedRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({
        shippingStatus: 'SHIPPED',
        courierName: 'BlueDart Express',
        trackingNumber: 'BD-789012345',
      }),
    });
    if (!updateShippedRes.ok) {
      throw new Error(`Failed to update shipping to SHIPPED: ${updateShippedRes.status}`);
    }
    const shippedOrder = await updateShippedRes.json();
    if (shippedOrder.shippingStatus !== 'SHIPPED') {
      throw new Error(`Expected shippingStatus to be SHIPPED, got ${shippedOrder.shippingStatus}`);
    }
    if (shippedOrder.courierName !== 'BlueDart Express' || shippedOrder.trackingNumber !== 'BD-789012345') {
      throw new Error('Courier or trackingNumber mismatch');
    }
    if (!shippedOrder.shippedAt) {
      throw new Error('Expected shippedAt to be auto-stamped upon entering SHIPPED');
    }
    if (shippedOrder.deliveredAt !== null) {
      throw new Error('deliveredAt should still be null');
    }
    console.log('✓ Admin set shippingStatus = SHIPPED with courier and tracking number');
    console.log('✓ shippedAt timestamp was automatically stamped:', shippedOrder.shippedAt);

    // ----------------------------------------------------
    // Test 3: Customer Order Details Reflects Shipping Data
    // ----------------------------------------------------
    console.log('\n--- Test 3: Customer Access to Shipping Data & Isolation ---');
    const custOrderRes = await fetch(`${BASE_URL}/orders/${order.id}`, {
      headers: { Cookie: customerCookies },
    });
    if (!custOrderRes.ok) throw new Error('Customer failed to get own order');
    const custOrder = await custOrderRes.json();
    if (custOrder.shippingStatus !== 'SHIPPED') {
      throw new Error(`Customer received shippingStatus ${custOrder.shippingStatus}, expected SHIPPED`);
    }
    if (custOrder.courierName !== 'BlueDart Express' || custOrder.trackingNumber !== 'BD-789012345') {
      throw new Error('Customer did not receive courier tracking information');
    }
    if (!custOrder.shippedAt) {
      throw new Error('Customer did not receive shippedAt timestamp');
    }
    console.log('✓ Customer GET /orders/:id returned shipping status, courier name, and tracking details');

    // Customer order list check
    const custOrdersListRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Cookie: customerCookies },
    });
    const custOrdersList = await custOrdersListRes.json();
    const listedOrder = custOrdersList.find((o: any) => o.id === order.id);
    if (!listedOrder || listedOrder.shippingStatus !== 'SHIPPED' || listedOrder.trackingNumber !== 'BD-789012345') {
      throw new Error('Customer order list missing shipping details');
    }
    console.log('✓ Customer GET /orders list displays shippingStatus and trackingNumber');

    // Cross-user access check
    const crossUserRes = await fetch(`${BASE_URL}/orders/${order.id}`, {
      headers: { Cookie: customer2Cookies },
    });
    if (crossUserRes.status !== 404) {
      throw new Error(`Expected 404 for cross-user order access, got ${crossUserRes.status}`);
    }
    console.log('✓ Cross-user order details access protected: returned 404');

    // ----------------------------------------------------
    // Test 4: Transition to OUT_FOR_DELIVERY
    // ----------------------------------------------------
    console.log('\n--- Test 4: Transition to OUT_FOR_DELIVERY ---');
    const outForDeliveryRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ shippingStatus: 'OUT_FOR_DELIVERY' }),
    });
    const outForDeliveryOrder = await outForDeliveryRes.json();
    if (outForDeliveryOrder.shippingStatus !== 'OUT_FOR_DELIVERY') {
      throw new Error(`Expected OUT_FOR_DELIVERY, got ${outForDeliveryOrder.shippingStatus}`);
    }
    if (!outForDeliveryOrder.shippedAt) {
      throw new Error('shippedAt timestamp should remain preserved');
    }
    console.log('✓ Admin transitioned status to OUT_FOR_DELIVERY');

    // ----------------------------------------------------
    // Test 5: Transition to DELIVERED & Automatic Synchronization
    // ----------------------------------------------------
    console.log('\n--- Test 5: Shipping DELIVERED & Automatic Order Status Synchronization ---');
    const deliveredRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/shipping`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ shippingStatus: 'DELIVERED' }),
    });
    const deliveredOrder = await deliveredRes.json();
    if (deliveredOrder.shippingStatus !== 'DELIVERED') {
      throw new Error(`Expected shippingStatus DELIVERED, got ${deliveredOrder.shippingStatus}`);
    }
    if (!deliveredOrder.deliveredAt) {
      throw new Error('deliveredAt should be auto-stamped upon entering DELIVERED');
    }
    if (deliveredOrder.status !== 'DELIVERED') {
      throw new Error(`Expected order.status to be automatically synced to DELIVERED, got ${deliveredOrder.status}`);
    }
    console.log('✓ Transitioning shipping to DELIVERED automatically stamped deliveredAt:', deliveredOrder.deliveredAt);
    console.log('✓ Transitioning shipping to DELIVERED automatically synced order.status to DELIVERED');

    // ----------------------------------------------------
    // Test 6: Setting Order Status to DELIVERED Syncs Shipping
    // ----------------------------------------------------
    console.log('\n--- Test 6: Setting Order Status to DELIVERED Syncs Shipping ---');
    // Place second order
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    const order2Res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookies },
      body: JSON.stringify({ addressId: address.id, paymentMethod: 'COD' }),
    });
    const order2 = await order2Res.json();
    console.log('Placed second test order:', order2.id);

    // Admin updates order status directly to DELIVERED
    const syncStatusRes = await fetch(`${BASE_URL}/admin/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    const syncedOrder2 = await syncStatusRes.json();
    if (syncedOrder2.status !== 'DELIVERED') {
      throw new Error(`Expected order status DELIVERED, got ${syncedOrder2.status}`);
    }
    if (syncedOrder2.shippingStatus !== 'DELIVERED') {
      throw new Error(`Expected shippingStatus to sync to DELIVERED, got ${syncedOrder2.shippingStatus}`);
    }
    if (!syncedOrder2.deliveredAt) {
      throw new Error('Expected deliveredAt to be stamped when order status set to DELIVERED');
    }
    console.log('✓ Setting order status to DELIVERED synced shippingStatus to DELIVERED and stamped deliveredAt');

    console.log('\n======================================================');
    console.log('✓ ALL PHASE 9 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    await app.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ PHASE 9 VERIFICATION FAILED:', err);
  process.exit(1);
});
