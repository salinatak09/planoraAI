# Planora AI – GenAI-Powered Event Planning Platform

Planora AI is an intelligent, full-stack event planning application built for orchestrating weddings, birthdays, anniversaries, and community gatherings. It combines AI-driven design and itinerary ideation (via Google Gemini) with real-time budget forecasting, vendor logistics, and task tracking.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Tokens** | [Tailwind CSS](https://tailwindcss.com/) (v4 with Custom Color Tokens) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) with official Node.js Driver |
| **GenAI SDK** | [Google Gemini](https://ai.google.dev/) via official `@google/genai` TypeScript SDK |
| **Validation** | [Zod](https://zod.dev/) runtime schema validation |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Automated Testing** | [Vitest](https://vitest.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📁 Architecture & File Structure

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/ideas/route.ts      # Gemini GenAI ideation endpoint
│   │   │   ├── events/route.ts        # Scoped event queries & creation
│   │   │   └── health/route.ts        # System diagnostic & connection health
│   │   ├── error.tsx                  # Global error boundary state
│   │   ├── globals.css                # Design tokens & color scales
│   │   ├── layout.tsx                 # Root layout with fonts & metadata
│   │   ├── loading.tsx                # Instant skeleton loading state
│   │   ├── not-found.tsx              # Custom 404 state
│   │   └── page.tsx                   # Server Component orchestrating dashboard
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── DashboardClient.tsx    # Interactive dashboard with Recharts & AI studio
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx          # Top navigation & user profile
│   │   │   └── Sidebar.tsx            # Responsive suite navigation
│   │   └── ui/
│   │       ├── Badge.tsx              # Event type, status & priority badges
│   │       ├── Button.tsx             # Accessible button with states & loaders
│   │       ├── Card.tsx               # Composite card primitive
│   │       ├── EmptyState.tsx         # Standardized empty states
│   │       └── Input.tsx              # Accessible form input with validation errors
│   ├── lib/
│   │   ├── ai/
│   │   │   └── gemini.ts              # Official @google/genai client with fallbacks
│   │   ├── auth/
│   │   │   └── session.ts             # Server-side authentication & user scoping
│   │   ├── db/
│   │   │   ├── client.ts              # MongoDB Atlas connection reuse for serverless & HMR
│   │   │   └── collections.ts         # Strongly-typed collections
│   │   ├── types/
│   │   │   └── index.ts               # Domain TypeScript interfaces & DTOs
│   │   ├── utils/
│   │   │   ├── currency.ts            # Currency and budget metrics calculations
│   │   │   ├── date.ts                # Date formatting & countdown helpers
│   │   │   └── response.ts            # Standardized API response utilities
│   │   └── validation/
│   │       └── schemas.ts             # Zod runtime schemas
│   └── tests/
│       ├── budget-calculator.test.ts  # Financial logic unit tests
│       └── validation.test.ts         # Zod contract verification tests
├── .env.example                       # Environment variable template
├── package.json
├── tsconfig.json
└── vitest.config.mts                  # Vitest runner configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (Tested on Node.js v26)
- **npm**: v10+

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/<your-org>/planora-ai.git
cd planora-ai
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required credentials in `.env.local`:
```env
# MongoDB Atlas Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority"
MONGODB_DB_NAME="planora_ai"

# Google Gemini API Key (@google/genai SDK)
GEMINI_API_KEY="AIzaSy..."

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

> **Note**: If `MONGODB_URI` or `GEMINI_API_KEY` are not yet set during local development, Planora AI will smoothly fall back to high-fidelity mock event data and responsive curated idea seeds.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Code Quality

```bash
# Run unit & schema tests with Vitest
npm test

# Run ESLint checks
npm run lint

# Run TypeScript compilation check
npx tsc --noEmit

# Run full Next.js production build
npm run build
```

---

## 🔒 Security & Data Scoping Principles
1. **Server-Side Authorization**: Every database query is strictly scoped to `userId` resolved by the server session (`src/lib/auth/session.ts`). Client-supplied identity or permissions are never trusted.
2. **Strict Validation**: All incoming payloads pass through `Zod` schemas before touching domain logic or database storage.
3. **Secret Isolation**: `MONGODB_URI` and `GEMINI_API_KEY` are strictly read server-side in API routes and never bundled to the client.
4. **Connection Caching**: MongoDB Atlas driver connection promises are cached across HMR cycles in development and reused across function invocations in serverless deployments.

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into the [Vercel Dashboard](https://vercel.com/).
3. Add the environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `GEMINI_API_KEY`
4. Deploy. Vercel automatically detects Next.js App Router and provisions serverless edge functions for the API routes.
