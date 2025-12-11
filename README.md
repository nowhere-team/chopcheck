<p align="center">
  
</p>
<h1 align="center">ChopCheck</h1>
<p align="center">Split bills with friends. Scan a receipt, pick your items, pay your share.</p>


## How It Works

### Receipt Processing

~70% of Russian receipts have fiscal QR codes. We fetch structured data directly from the Federal Tax Service API in 2-3 seconds. For the remaining 30%, we use Gemini 2.0 Flash for image recognition.
```
QR Code → FNS API → Catalog → Enriched Items
Photo → Gemini → Catalog → Enriched Items
```

### Smart Enrichment

Raw receipt data is cryptic: `"ПЦ МАРГАРИТА 30СМ"`. Our catalog service transforms it into something humans understand:

| Raw               | Enriched           |
|-------------------|--------------------|
| ПЦ МАРГАРИТА 30СМ | 🍕 Пицца Маргарита |
| КАПУЧИНО 300МЛ    | ☕ Капучино         |
| СОК ЯБЛОЧ. 0.2    | 🧃 Яблочный сок    |

Plus categories, suggested split methods, and more.

### Flexible Division

Not everything splits equally:

| Method | Use Case |
|--------|----------|
| **Equal** | Pizza shared by 3 people → ⅓ each |
| **Shares** | Wine bottle: 2 glasses vs 1 glass |
| **Fixed** | "I'll cover the appetizer" |
| **Proportional** | Service fee based on order size |

### Real-time Sync

Everyone sees updates instantly. When Kate selects her items, Max sees the totals recalculate live.

## Architecture
**Services:**
- `backend` — API server (Bun + Hono)
- `frontend` — SvelteKit web app
- `telegram` — Grammy bot for notifications

**External:**
- **FNS API** — Russian fiscal receipt data
- **Catalog** — enrichment service (private)
- **Gemini** — image recognition via OpenRouter

## Part of Nowhere

ChopCheck is the first product in the **nowhere** ecosystem — tools for simplifying offline activities. The social graph built here enables future products for group coordination.

---

© nowhere team
