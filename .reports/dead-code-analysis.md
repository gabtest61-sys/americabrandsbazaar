# Dead Code Analysis Report

Generated: 2026-01-28

## Summary

| Category | Count |
|----------|-------|
| Unused Files | 8 |
| Unused Exports | 31 |
| Unused Types | 11 |

---

## SAFE - Unused Files (Can Delete)

These files are not imported anywhere in the codebase:

| File | Risk | Notes |
|------|------|-------|
| `src/components/PageTransition.tsx` | SAFE | Animation utility, not used |
| `src/components/SearchAutocomplete.tsx` | SAFE | Search component, not integrated |
| `src/components/ShareButtons.tsx` | SAFE | Social sharing, not used |
| `src/lib/orders.ts` | SAFE | Old orders module, replaced by firestore.ts |
| `src/components/ai-dresser/LookCard.tsx` | SAFE | AI dresser component, not used |
| `src/components/ai-dresser/ProductCardSkeleton.tsx` | SAFE | Skeleton loader, not used |
| `src/components/ai-dresser/QuizIntro.tsx` | SAFE | Quiz intro component, not used |
| `src/components/ai-dresser/ResultsSkeleton.tsx` | SAFE | Results skeleton, not used |

---

## CAUTION - Unused Exports (Review Before Removing)

### src/lib/firestore.ts
| Export | Line | Notes |
|--------|------|-------|
| `uploadProductImage` | 24 | Image upload utility |
| `deleteProductImage` | 45 | Image deletion |
| `addBonusAIDresserSessions` | 500 | Bonus session feature |
| `hasUserPurchasedProduct` | 743 | Purchase verification |
| `getProductRating` | 842 | Rating calculation |
| `getFirestoreProduct` | 959 | Single product fetch |
| `deleteUserData` | 1101 | User data deletion |
| Type: `WishlistItem` | 561 | Wishlist type definition |

### src/lib/products.ts
| Export | Line | Notes |
|--------|------|-------|
| `getProductById` | 30 | May be needed for product pages |
| `getProductsByCategory` | 34 | Category filtering |
| `getProductsByBrand` | 38 | Brand filtering |
| `getFeaturedProducts` | 42 | Featured products |
| `getGiftSuitableProducts` | 46 | Gift filtering |
| `searchProducts` | 50 | Search functionality |
| `filterProducts` | 60 | Product filtering |

### src/lib/ai-dresser-engine.ts
| Export | Line | Notes |
|--------|------|-------|
| `scoreProduct` | 42 | AI scoring algorithm |
| `generateLookName` | 191 | Look name generator |

### src/lib/ai-dresser.ts
| Export | Line | Notes |
|--------|------|-------|
| `checkAIDresserAccess` | 126 | Access check |
| `startQuizSession` | 149 | Quiz session |
| `submitQuizAnswer` | 168 | Quiz submission |
| Types: multiple | - | AI dresser types |

### src/lib/ai-dresser-constants.ts
| Export | Line | Notes |
|--------|------|-------|
| `styleOptions` | 4 | Style options |
| `occasionOptions` | 13 | Occasion options |
| `colorOptions` | 29 | Color options |
| `recipientOptions` | 37 | Recipient options |
| `giftOccasionOptions` | 45 | Gift occasion options |

### src/lib/constants.ts
| Export | Line | Notes |
|--------|------|-------|
| `COLORS` | 9 | Color definitions |
| `CATEGORIES` | 24 | Category definitions |
| `FEATURED_PRODUCTS` | 49 | Featured product IDs |

### src/lib/webhook.ts
| Export | Line | Notes |
|--------|------|-------|
| `createAddToCartPayload` | 34 | Webhook payload |
| `formatMessengerMessage` | 116 | Message formatter |

### src/components/ProductSkeleton.tsx
| Export | Line | Notes |
|--------|------|-------|
| `ProductCardSkeleton` | 4 | Skeleton component |
| `OrderCardSkeleton` | 108 | Order skeleton |

### src/lib/paymongo.ts
| Export | Line | Notes |
|--------|------|-------|
| `fromCentavos` | 281 | Currency conversion |
| Types: `PayMongoCheckoutData`, `PayMongoCheckoutResponse` | - | PayMongo types |

---

## Recommended Actions

### Phase 1: Safe Deletions (No Risk)
Delete these unused component files:
- `src/components/PageTransition.tsx`
- `src/components/SearchAutocomplete.tsx`
- `src/components/ShareButtons.tsx`
- `src/lib/orders.ts`
- `src/components/ai-dresser/LookCard.tsx`
- `src/components/ai-dresser/ProductCardSkeleton.tsx`
- `src/components/ai-dresser/QuizIntro.tsx`
- `src/components/ai-dresser/ResultsSkeleton.tsx`

### Phase 2: Review Required
The following exports may be used by API routes or dynamically:
- `src/lib/products.ts` - Could be used by product pages/API
- `src/lib/paymongo.ts` - Payment integration (keep if payment planned)
- `src/lib/firestore.ts` exports - Admin/API may use these

### Not Recommended to Delete
- Config files and type definitions
- Default exports from firebase.ts, cloudinary.ts
- AI dresser related code (may be feature in progress)
