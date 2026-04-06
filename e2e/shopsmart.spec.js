import { test, expect } from '@playwright/test';

// Helper: seed a product via API before tests
async function seedProduct(request, product = { name: 'E2E Apple', price: 2.5, category: 'fruit', stock: 10 }) {
  const res = await request.post('http://localhost:5001/api/products', {
    data: product,
  });
  return res.json();
}

test.describe('ShopSmart E2E', () => {
  test('homepage loads and shows the navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ShopSmart')).toBeVisible();
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
    await expect(page.getByText(/Cart/)).toBeVisible();
  });

  test('products appear on the page', async ({ page, request }) => {
    await seedProduct(request);
    await page.goto('/');
    await expect(page.getByText('E2E Apple')).toBeVisible();
  });

  test('search filters products', async ({ page, request }) => {
    await seedProduct(request, { name: 'Mango', price: 3, category: 'fruit', stock: 5 });
    await seedProduct(request, { name: 'Orange', price: 1.5, category: 'citrus', stock: 8 });

    await page.goto('/');
    await page.getByPlaceholder('Search products...').fill('Mango');

    await expect(page.getByText('Mango')).toBeVisible();
    await expect(page.getByText('Orange')).not.toBeVisible();
  });

  test('user flow: login → add product to cart → view cart → remove item', async ({ page, request }) => {
    await seedProduct(request, { name: 'Cart Test Item', price: 5, category: 'test', stock: 10 });
    
    // Create an auth user directly via API for this test
    await request.post('http://localhost:5001/api/auth/register', {
      data: { name: 'E2E User', email: 'e2e@test.com', password: 'password123' },
    });

    await page.goto('/');

    // Login flow
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder('Email Address').fill('e2e@test.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.locator('.auth-form').getByRole('button', { name: 'Login' }).click();

    // Give the login time to register and modal to close
    await expect(page.getByText('Logout')).toBeVisible();

    // Add to cart
    await page.getByText('Cart Test Item').waitFor();
    const card = page.locator('.product-card', { hasText: 'Cart Test Item' });
    await card.getByText('Add to Cart').click();

    // Open cart
    await page.getByText(/Cart/).click();
    await expect(page.getByText('Cart Test Item')).toBeVisible();

    // Remove from cart
    await page.locator('.btn-remove').first().click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('cart count updates after adding item', async ({ page, request }) => {
    await seedProduct(request, { name: 'Counter Item', price: 1, category: 'test', stock: 5 });
    
    // Create second auth user directly via API for this test
    await request.post('http://localhost:5001/api/auth/register', {
      data: { name: 'E2E User 2', email: 'e2e2@test.com', password: 'password123' },
    });

    await page.goto('/');

    // Login flow
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByPlaceholder('Email Address').fill('e2e2@test.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.locator('.auth-form').getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Logout')).toBeVisible();

    await page.getByText('Counter Item').waitFor();

    const card = page.locator('.product-card', { hasText: 'Counter Item' });
    await card.getByText('Add to Cart').click();

    await expect(page.locator('.cart-count')).toHaveText('1');
  });
});
