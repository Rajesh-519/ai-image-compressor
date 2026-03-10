# CompressAI Pro

CompressAI Pro is a production-oriented SaaS scaffold for AI-assisted image compression, format conversion, responsive image generation, SEO metadata, and website image audits.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth with Google OAuth
- Stripe subscriptions
- Sharp and Squoosh codecs
- Vercel deployment target

## Project Structure

```text
app/
  api/
    audit/
    auth/[...nextauth]/
    bulk/
    compress/
    convert/
    keys/
    stripe/
    usage/
  analytics/
  compressor/
  dashboard/
    api/
    billing/
    images/
  pricing/
  signin/
components/
  analytics/
  auth/
  compressor/
  dashboard/
  layout/
  marketing/
  ui/
hooks/
lib/
  ai/
  image/
    processors/
prisma/
types/
utils/
```

## Core Capabilities

- Smart image compression with drag-and-drop, file upload, paste, and image URL ingestion
- Format conversion between JPEG, PNG, WebP, AVIF, HEIC, and JPEG XL paths
- Face and text protected-region detection to preserve critical detail during compression
- Content-aware optimization heuristics with optional AI-assisted SEO metadata
- Bulk compression with ZIP ingestion and ZIP export
- Browser-side edge compression with WebAssembly codecs for fast local AVIF/WebP/JPEG/PNG output
- Responsive image variant generation with `srcset` output
- AI-assisted alt text, title, caption, and filename generation
- Website image audit endpoint for oversized or legacy assets
- Dashboard for history, usage, billing, and API key management
- Stripe checkout, billing portal, and webhook subscription syncing

## Environment

Copy values from `.env.example` into your deployment environment.

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
OPENAI_API_KEY=
UPLOAD_MAX_FILE_SIZE_MB=
FREE_DAILY_IMAGE_LIMIT=
APP_BASE_URL=
```

## Local Development

1. Install dependencies.
2. Create a PostgreSQL database.
3. Provide environment variables.
4. Generate the Prisma client and run migrations.
5. Start the dev server.

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Deployment

### Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Set all environment variables from `.env.example`.
4. Attach a PostgreSQL database.
5. Add your Google OAuth redirect URL:
   `https://your-domain.com/api/auth/callback/google`
6. Add your Stripe webhook endpoint:
   `https://your-domain.com/api/stripe/webhook`
7. Deploy.

### Build Command

```bash
npm run build
```

## API Surface

```text
POST /api/compress
POST /api/convert
POST /api/bulk
POST /api/audit
POST /api/keys
GET  /api/keys
GET  /api/usage
POST /api/stripe/checkout
POST /api/stripe/portal
POST /api/stripe/webhook
```

## Notes

- `sharp` handles the default production path.
- `@squoosh/lib` is used for JPEG XL-oriented encoding flows.
- `@jsquash/*` codecs power the browser-side edge compression path.
- Browser-side face detection uses BlazeFace and text detection uses Tesseract.
- OpenAI integration is optional and falls back to deterministic SEO metadata when no API key is configured.
- Persisted storage for generated files is intentionally left abstract so you can plug in S3, Cloudinary, or another object store.
