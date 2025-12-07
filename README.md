# Ship AI - Brokerless Freight Marketplace

AI-Powered freight intelligence platform connecting verified shippers and asset-based carriers.

## 🚀 Quick Start

```bash
# Start the development server
npm run dev
```

Then open **http://localhost:8080/site** in your browser.

## 📁 Project Location

This project lives at:
```
/Users/sebas/ship-ai
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:8080 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🗂️ Key Directories

```
src/
├── pages/site/       # Marketing pages (Home, About, Pricing, etc.)
├── components/site/  # Site components (Nav, Footer, ROI Calculator, etc.)
├── pages/app/        # Dashboard app pages
├── components/ui/    # Shared UI components (shadcn/ui)
└── lib/              # Utilities and helpers
```

## 🛠️ Tech Stack

- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Supabase** - Backend/Database
- **React Router** - Routing

## 🌐 Main URLs

| URL | Page |
|-----|------|
| `/site` | Home / Landing page |
| `/site/about` | About page |
| `/site/pricing` | Pricing page |
| `/site/contact` | Contact page |
| `/site/roles` | Shippers & Carriers info |
| `/site/trust` | Trust & Safety |
| `/site/auth` | Login/Signup |
| `/app` | Main Dashboard |

## 📝 Environment Variables

Copy `.env.example` to `.env` and fill in your values:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (for autocomplete)

---

**Need help?** Just ask in Antigravity! 🤖
