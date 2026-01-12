# LGM Apparel

A modern e-commerce platform for premium branded apparel, built with Next.js 16 and deployed on Vercel.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage, Cloudinary |
| Payments | PayMongo (GCash, Maya, Cards) |
| Hosting | Vercel |

## Features

### Shop
- Product catalog with filters (category, brand, color, price)
- Search with autocomplete suggestions
- Product quick view modal
- Recently viewed products
- Low stock indicators
- Skeleton loaders
- Breadcrumb navigation

### Cart & Checkout
- Shopping cart with quantity controls
- Coupon/promo codes
- Multiple shipping regions
- Online payment (PayMongo) & COD
- Guest checkout option

### User Account
- Order history with reorder button
- Wishlist management
- Saved AI Dresser looks
- Profile settings

### Admin Dashboard
- Product management (CRUD)
- Bulk actions (delete, stock update)
- Order management
- Sales analytics & conversion metrics
- CSV export

### AI Dresser
- AI-powered outfit recommendations
- Save looks to account
- Add complete outfits to cart

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- PayMongo account (for payments)
- Cloudinary account (for image uploads)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lgm-apparel

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# PayMongo
PAYMONGO_SECRET_KEY=
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (serverless functions)
│   │   ├── ai-dresser/    # AI styling endpoints
│   │   ├── paymongo/      # Payment endpoints
│   │   └── ...
│   ├── shop/              # Shop pages
│   ├── checkout/          # Checkout flow
│   └── account/           # User account
├── components/            # Reusable React components
├── context/               # React context providers
├── lib/                   # Utilities and configurations
│   ├── firebase.ts        # Firebase config
│   ├── firestore.ts       # Database operations
│   └── ...
└── styles/                # Global styles
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in Vercel settings
4. Deploy

### Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `lgmapparel.com`)
3. Configure DNS at your registrar:
   - **Option A**: Use Vercel nameservers
   - **Option B**: Add A record (`76.76.21.21`) and CNAME (`cname.vercel-dns.com`)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/paymongo/checkout` | Create payment session |
| `/api/paymongo/webhook` | Handle payment webhooks |
| `/api/ai-dresser/get-recommendations` | Get AI outfit suggestions |
| `/api/orders` | Order management |
| `/api/upload` | Image uploads to Cloudinary |

## License

Private - All rights reserved
