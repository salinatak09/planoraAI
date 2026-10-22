# Planora AI – GenAI-Powered Event Planning Platform

Planora AI is an intelligent, full-stack event planning application built for orchestrating weddings, birthdays, anniversaries, and community gatherings. It combines AI-driven design and itinerary ideation (via Google Gemini) with real-time budget forecasting, vendor logistics, and task tracking.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Tokens** | [Tailwind CSS](https://tailwindcss.com/) (Google Stitch Design Tokens) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) with official Node.js Driver (`mongodb`) |
| **GenAI SDK** | [Google Gemini](https://ai.google.dev/) via official `@google/genai` TypeScript SDK |
| **Validation** | [Zod](https://zod.dev/) runtime schema validation |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Automated Testing** | [Vitest](https://vitest.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🗄️ MongoDB Atlas Data Layer Architecture

The data layer is implemented in [`src/lib/mongodb.ts`](src/lib/mongodb.ts) using the official `mongodb` Node.js driver.

### Connection Reuse & Safety
- **Development**: Caches the client connection promise on `globalThis._mongoClientPromise` to prevent connection socket exhaustion during Next.js Hot Module Replacement (HMR).
- **Serverless / Production**: Reuses the module-scoped client promise across serverless function executions.
- **Fail-Safe Configuration**: Throws a descriptive configuration error when `MONGODB_URI` is missing without leaking credentials or URLs.
- **Secret Isolation**: `MONGODB_URI` and `MONGODB_DB` are only read on the server. Credentials are never sent in API responses or bundled into client code.

### Data Models & Zod Schemas
Located in [`src/lib/types/models.ts`](src/lib/types/models.ts) and [`src/lib/validation/schemas.ts`](src/lib/validation/schemas.ts):

1. **User**: `displayName`, `email`, `authProvider`, `preferences`, `createdAt`.
2. **Event**: `ownerId`, `title`, `type`, `date`, `timezone`, `location`, `guestCount`, `currency`, `totalBudget`, `theme`, `preferences`, `status`, `createdAt`, `updatedAt`.
3. **BudgetItem**: `eventId`, `ownerId`, `category`, `description`, `estimatedAmount`, `actualAmount`, `paymentStatus`.
4. **Task**: `eventId`, `ownerId`, `title`, `description`, `dueDate`, `priority`, `status`, `assignedTo`.
5. **Vendor**: `ownerId` (or null for shared directory scope), `isShared`, `name`, `category`, `location`, `contact`, `priceRange`, `verificationStatus`.
6. **EventVendor**: `eventId`, `vendorId`, `ownerId`, `quotedAmount`, `bookingStatus`, `notes`.
7. **Idea**: `eventId`, `ownerId`, `category`, `title`, `description`, `estimatedCost`.
8. **ConversationMessage**: `eventId`, `ownerId`, `role`, `content`, `createdAt`.

### Data Integrity & Ownership Enforcement
- **Session-Derived Ownership**: Ownership is extracted strictly from the authenticated server-side session, never from client payload fields (`src/lib/db/services.ts`).
- **Child Record Guard**: `verifyEventOwnership(eventId, ownerId)` strictly checks that the current user owns the parent event before reading, creating, or modifying any child records (`BudgetItem`, `Task`, `EventVendor`, `Idea`, `ConversationMessage`).
- **ObjectId Serialization**: All ObjectIds and Dates are safely converted to ISO strings at API boundaries using [`src/lib/utils/objectid.ts`](src/lib/utils/objectid.ts).
- **Pagination**: Paginated endpoints limit results with safety caps (max 100 items per page) using [`src/lib/utils/pagination.ts`](src/lib/utils/pagination.ts).
- **Automated Indexes**: [`ensureDatabaseIndexes()`](src/lib/db/collections.ts) establishes indexes for:
  - `users.email` (unique)
  - `events.ownerId + createdAt`, `events.status`, `events.date`
  - `budget_items.eventId + ownerId`, `budget_items.category`
  - `tasks.eventId + ownerId`, `tasks.eventId + dueDate`, `tasks.priority + status`
  - `vendors.isShared + category`, `vendors.ownerId`
  - `event_vendors.eventId + vendorId` (unique), `event_vendors.eventId + ownerId`
  - `ideas.eventId + ownerId`, `ideas.category`
  - `conversation_messages.eventId + ownerId + createdAt`

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (Tested on Node.js v26)
- **npm**: v10+
- **MongoDB Atlas Cluster**: (Free Tier M0 or higher)

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your secrets in `.env.local`:
```env
# MongoDB Atlas Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority"

# Target Database Name
MONGODB_DB="planora_ai"

# Google Gemini API Key
GEMINI_API_KEY="AIzaSy..."

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

> **Note**: If `MONGODB_URI` is not configured during local development, the application safely informs the user on the health endpoint without exposing any secrets, while the UI continues to function smoothly in demo mode.

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🩺 Health Check Endpoints

- **Overall Health**: `GET /api/health`
  Returns system version, runtime status, and database connection state without leaking secrets.
- **Database Ping**: `GET /api/health/db`
  Performs an actual MongoDB `ping` command, returning round-trip latency (`latencyMs`) and database name. Returns HTTP 200 when connected, or HTTP 503 with sanitized error message when unavailable.

---

## 🧪 Testing & Code Quality

```bash
# Run unit, schema, and ownership tests
npm test

# Run ESLint validation
npm run lint

# Run strict TypeScript compiler verification
npx tsc --noEmit

# Run full Next.js production build
npm run build
```
