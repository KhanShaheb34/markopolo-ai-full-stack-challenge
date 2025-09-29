# Marketing Orchestration Chat (MarkoPolo AI Full Stack Challenge)

A Perplexity-style marketing campaign planning interface that helps users generate multi-channel campaigns with AI-powered audience insights, message optimization, and perfect timing.

## ✨ Features

- **🎯 Perplexity-Style Interface** - Clean chat UI with left rail navigation and hover-expanded secondary rail
- **📊 Data Source Integration** - Connect to 5 different data sources with mock fixtures
- **📢 Multi-Channel Support** - Plan campaigns across 7 marketing channels
- **🔄 Real-Time Streaming** - Watch campaign plans generate in real-time with SSE
- **💾 Chat History** - Persistent chat history with localStorage using Jotai's atomWithStorage
- **🎨 Dark/Light Theme** - System-aware theme switching with next-themes
- **📋 Copy/Download** - Export campaign plans as JSON with syntax highlighting
- **♿ Accessibility** - WCAG AA compliant with proper ARIA labels and keyboard navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/KhanShaheb34/markopolo-ai-full-stack-challenge.git
cd markopolo-ai-full-stack-challenge

# Install dependencies
pnpm install

# Run the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Usage

1. **Select Data Sources** - Hover over the Database icon to choose 3+ data sources
2. **Choose Channels** - Hover over the Send icon to select 4+ marketing channels
3. **Enter Campaign Goal** - Type your campaign objective (e.g., "Plan Black Friday reactivation")
4. **Watch Streaming** - See the 5-stage planning process in real-time:
   - 🔍 **Profiling** - Analyzing data sources and extracting signals
   - 👥 **Audience** - Identifying target segments and sizing
   - 📢 **Channels** - Mapping channels to audiences
   - ⏰ **Timing** - Optimizing schedule and frequency
   - 🛡️ **Guardrails** - Applying compliance and safety checks
5. **Export Results** - Copy or download the executable campaign plan JSON

## 🗂️ Data Sources (5 Available)

All connections are **mocked** with realistic fixture data:

| Source             | Description                 |
| ------------------ | --------------------------- |
| **Website Pixel**  | GTM/FB Pixel/Google Ads Tag |
| **Shopify**        | Orders & Customer Data      |
| **Facebook Page**  | Posts & Engagement          |
| **Review Sites**   | Ratings & Feedback          |
| **Twitter/X Page** | Followers & Engagement      |

## 📢 Marketing Channels (7 Available)

| Channel       | Provider          | Features                             |
| ------------- | ----------------- | ------------------------------------ |
| **Email**     | Klaviyo           | Subject/body variants, A/B testing   |
| **SMS**       | Twilio            | Character limits, opt-in compliance  |
| **WhatsApp**  | WhatsApp Business | Rich media, interactive buttons      |
| **Push**      | OneSignal         | Platform targeting, deep links       |
| **Voice**     | Twilio Voice      | Script templates, timing constraints |
| **Messenger** | Meta Messenger    | Chat flows, quick replies            |
| **Ads**       | Meta/Google Ads   | Creative briefs, audience mapping    |

## 🔧 Tech Stack

- **Framework**: Next.js 15 (App Router, SSE streaming)
- **Language**: TypeScript with strict type safety
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: Jotai with atomWithStorage for persistence
- **Icons**: Lucide React
- **Theme**: next-themes (system/dark/light)
- **Validation**: Zod schemas
- **Notifications**: Sonner toast library
- **Linting**: Biome (faster than ESLint)

## 🏗️ Architecture

### File Structure

```
src/
├── app/
│   ├── api/stream/          # SSE endpoint for campaign generation
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Main chat interface
├── components/ui/           # Reusable UI components
│   ├── chat-composer.tsx    # Message input with validation
│   ├── hover-rail.tsx       # Secondary rail for sources/channels
│   ├── json-viewer.tsx      # Syntax-highlighted JSON display
│   ├── left-rail.tsx        # Primary navigation rail
│   ├── message.tsx          # Chat message bubble
│   ├── status-chips.tsx     # 5-stage progress visualization
│   └── theme-switcher.tsx   # Dark/light mode toggle
├── lib/
│   ├── fixtures/            # Mock data for all sources
│   ├── plan/                # Campaign planning business logic
│   ├── schema/              # Zod validation schemas
│   └── store/               # Jotai atoms and localStorage utilities
└── hooks/
    └── use-streaming.ts     # SSE streaming state management
```

### Campaign Plan JSON Structure

The generated JSON represents an **executable campaign plan** that can be transformed into real API calls:

```json
{
  "campaignId": "camp_1672934400000_xk9m2p",
  "objective": "reactivation",
  "kpis": {
    "roasTarget": 4.0,
    "cpaMax": 25.0,
    "ctrMin": 0.02
  },
  "timezone": "Asia/Dhaka",
  "audiences": [
    {
      "name": "At-Risk High LTV Customers",
      "source": ["shopify"],
      "criteria": {
        "lastPurchaseDate": { "lt": "2023-10-15" },
        "lifetimeValue": { "gte": 500 }
      },
      "sizeEstimate": 245,
      "exclusions": ["recent_purchasers"]
    }
  ],
  "channels": [
    {
      "channel": "email",
      "provider": "Klaviyo",
      "schedule": {
        "start": "09:00",
        "end": "19:00",
        "timezone": "Asia/Dhaka"
      },
      "frequencyCapPerUserPerWeek": 3,
      "variants": [
        {
          "name": "Primary",
          "subject": "{{first_name}}, your perfect {{top_product}} is waiting",
          "bodyHtml": "Hi {{first_name}},<br><br>Based on your recent activity...",
          "audience": "At-Risk High LTV Customers"
        }
      ],
      "tracking": {
        "utmSource": "email",
        "utmCampaign": "reactivation_campaign",
        "pixelEvents": ["email_open", "email_click"]
      }
    }
  ],
  "globalPacing": {
    "start": "2024-01-15T10:30:00.000Z",
    "end": "2024-02-14T10:30:00.000Z",
    "dailyMaxImpressionsPerUser": 3
  },
  "guardrails": {
    "brandSafety": ["competitor", "controversial", "adult"],
    "blocklistDomains": ["spam.com", "competitor.com"]
  },
  "explainability": [
    {
      "decision": "Chose reactivation objective",
      "becauseOf": [
        "prompt_contains_reactivation",
        "high_ltv_customers_detected"
      ]
    }
  ]
}
```

## 🧪 What's Mocked

- **OAuth flows** - All data sources show "Connected" or "Not Connected" status without real authentication
- **API integrations** - Uses JSON fixtures instead of live API calls to Shopify, Facebook, etc.
- **Campaign execution** - JSON output is structured for real provider APIs but not actually executed
- **Streaming delays** - Artificial 1.5s delays between stages for demo purposes

## 🏗️ Production Mapping

The generated JSON is designed to map directly to real provider APIs:

### Email (Klaviyo)

```javascript
// Generated JSON → Klaviyo API
const klaviyoPayload = {
  list_id: audience.criteria.klaviyo_segment_id,
  template_id: channel.templateId,
  send_time: channel.schedule.start,
  // ... more mappings
};
```

### SMS (Twilio)

```javascript
// Generated JSON → Twilio API
const twilioPayload = {
  to: audience.phone_numbers,
  body: channel.message,
  messaging_service_sid: "your_service_sid",
};
```

### Ads (Meta/Google)

```javascript
// Generated JSON → Meta Ads API
const metaPayload = {
  campaign_name: campaignId,
  objective: "CONVERSIONS",
  daily_budget: channel.networks.find((n) => n.name === "meta").budgetDaily,
  targeting: channel.audienceMapping[audience.name].meta,
};
```

## 🎯 Requirements Fulfilled

✅ **Perplexity-style chat interface**  
✅ **3+ data sources** (Website Pixel, Shopify, Twitter/X, Facebook Page, Review Sites)  
✅ **4+ channels** (Email, SMS, WhatsApp, Push, Voice, Messenger, Ads)  
✅ **Mock connections** with toggle functionality and fixture data  
✅ **Streaming JSON output** via Server-Sent Events  
✅ **"Right time, right channel, right message, right audience"** structure  
✅ **Executable campaign structure** ready for real provider APIs  
✅ **Copy/Download functionality** for JSON export  
✅ **Clean dark/light UI** with proper accessibility  
✅ **Public GitHub repository** ready for hosting

## 🚀 Deployment

This app is deployed on vercel.

## 🧑‍💻 Development

```bash
# Run development server
pnpm run dev

# Type checking
pnpm run build

# Linting
pnpm lint

# Fix linting issues
pnpm format
```

## 📝 License

MIT License - feel free to use this for your projects!
