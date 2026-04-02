# bns studio ecommerce

Production-style full-stack poster shop built with:

- `server/`: Node.js, Express, Prisma ORM, SQLite
- `client/`: React, Vite, React Router
- External payment flow via PayPal redirect only

## Features

- Public storefront with homepage, featured posters, filters, product detail pages, and responsive layout
- Customer authentication with registration, login, protected profile area, and order history
- Cart and checkout with server-side pricing calculation
- Automatic discount engine and coupon system
- Admin dashboard for products, orders, discount rules, coupons, and store settings
- PayPal redirect flow that saves the order first and redirects using the exact server-calculated final total

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables if you want custom values:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

3. Initialize the database and seed sample data:

```bash
cd server
npx prisma generate
npx prisma db push --skip-generate
node prisma/seed.js
cd ..
```

4. Start both apps:

```bash
npm run dev
```

5. Open:

- Storefront: `http://localhost:5173`
- API: `http://localhost:4000/api`

## Admin account

- Admin email: `bnsstudio26@gmail.com`

## Build commands

```bash
npm run build
```

## Environment variables

Root `.env` and `server/.env` support:

- `PORT=4000`
- `CLIENT_URL=http://localhost:5173`
- `VITE_API_URL=http://localhost:4000/api`
- `JWT_SECRET=change-this-secret`
- `DATABASE_URL="file:./dev.db"`
- `PAYPAL_ME_LINK=https://paypal.me/yourbrand`
- `PAYPAL_BUSINESS_EMAIL=`

## Payment flow

This app does not process card details internally. Payment is always external.

1. The customer fills checkout details.
2. The server recalculates pricing from the submitted cart.
3. The server creates an order with status `pending`.
4. The server stores:
   - subtotal
   - discount total
   - shipping total
   - final total
   - generated `orderReference`
5. The frontend shows a confirmation screen before redirect.
6. When the customer clicks `Continue to PayPal`, the frontend redirects using the exact final total returned by the server.

### Redirect strategy

- Best mode: set `PAYPAL_BUSINESS_EMAIL` or the `paypalBusinessEmail` admin setting.
  The backend generates a PayPal Website Payments Standard redirect URL with:
  - exact final amount
  - currency code
  - item name
  - `invoice` = order reference
  - `custom` = order reference
  - return URL back to the storefront
- Fallback mode: if only `PAYPAL_ME_LINK` is configured, the backend generates a PayPal.Me URL with the exact amount appended.
  This preserves amount synchronization, but PayPal.Me does not reliably carry a structured order reference through the redirect flow.

## Pricing logic

Server-side pricing lives in `server/src/services/pricing.js`.

- 3 or more posters: `30%` automatic discount
- 2 or more posters: free shipping
- Coupon types:
  - percentage
  - fixed amount
- Coupon validation checks:
  - active state
  - expiration date
  - usage limit

The cart and checkout screens request a live pricing preview from the backend, so the amount shown before payment matches the backend calculation.

## Admin customization

Login as admin and use `/admin` to manage:

- Products
- Orders and statuses (`pending`, `paid`, `shipped`)
- Automatic discount rules
- Coupon codes
- Store settings

Useful settings available in the admin UI:

- `storeName`
- `logoUrl`
- `primaryColor`
- `paypalMeLink`
- `paypalBusinessEmail`
- `currencyCode`
- `shippingCost`
- `heroHeadline`

## Branding and product customization

To change branding:

- Update store settings from the admin panel
- Adjust global styling in `client/src/styles.css`
- The default logo asset is stored at `client/public/brand/logo.png`
- The navbar, auth screen, admin sidebar, and checkout use that logo by default

To add or edit products:

- Use the admin products page
- Or seed additional products in `server/prisma/seed.js`
- Upload locali disponibili nel pannello admin prodotti
- Le immagini caricate vengono salvate in `server/uploads/products/`

## Theme customization

The premium storefront theme is centered around:

- black: `#000000`
- white: `#ffffff`
- accent yellow: `#e3f503`

Theme tokens live in `client/src/styles.css` under `:root`.

Useful places to customize:

- Colors: edit `--text`, `--bg`, `--surface`, and `--accent`
- Radii and spacing feel: edit `--radius`, `--radius-sm`, and layout spacing values
- Typography and layout behavior: edit the section, hero, card, and checkout rules in `client/src/styles.css`

If you want to replace the logo:

1. Overwrite `client/public/brand/logo.png`
2. Keep the same filename, or update the `/brand/logo.png` references in the client components

## Product image uploads

The admin product form supports local image uploads:

- Files are uploaded via `POST /api/admin/uploads`
- Uploaded files are stored in `server/uploads/products/`
- Image paths are saved in the database and reused in cards and product galleries
- Multiple images are supported for product galleries

After schema changes or on a fresh setup, run:

```bash
cd server
npx prisma generate
npx prisma db push --skip-generate
node prisma/seed.js
cd ..
```

## Database overview

The SQLite schema includes:

- `User`
- `Product`
- `Order`
- `OrderItem`
- `Coupon`
- `DiscountRule`
- `Setting`

## Notes

- Order totals are stored on the server before redirect.
- Orders remain `pending` until an admin marks them `paid` or `shipped`.
- Coupon usage currently increments at order creation time to reserve the discount.

## Future improvements

- Replace PayPal Website Payments Standard / PayPal.Me fallback with a full PayPal Orders API integration
- Add webhook verification for payment confirmation
- Add stock reservation and automatic release for abandoned pending orders
- Add image uploads instead of URL-only media
- Add tests for pricing, coupon validation, and checkout flows
