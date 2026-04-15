# SkillHub

A lightweight full-stack application for discovering, sharing, and managing Skill resources. Built with Next.js, SQLite, and Alibaba Cloud OSS, with Feishu (Lark) H5 authentication.

> This is a custom lightweight deployment based on the [original SkillHub project](https://github.com/iflytek/skillhub), replacing the Java Spring Boot + Docker architecture with a simpler Next.js full-stack approach.

## Tech Stack

- **Framework**: Next.js 14 (App Router, Full-stack)
- **Database**: SQLite (via better-sqlite3)
- **File Storage**: Alibaba Cloud OSS
- **Authentication**: Feishu H5 Auto-login
- **Styling**: Tailwind CSS v4
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy + HTTPS)

## Features

- Feishu H5 auto-login (runs inside Feishu client)
- Skill upload with file storage on Alibaba Cloud OSS
- Skill browsing with search and sorting (newest, most downloaded, highest rated)
- Skill detail page with description, ratings, and comments
- Star rating system (1-5 stars)
- Comment system
- Download tracking with signed URLs
- Admin panel (user management + audit logs)
- Role-based access control (user / admin / super_admin)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home - Skill list
│   ├── publish/page.tsx      # Publish new Skill
│   ├── skill/[id]/page.tsx   # Skill detail
│   ├── admin/page.tsx        # Admin panel
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       ├── auth/
│       │   ├── feishu/route.ts   # Feishu login
│       │   ├── me/route.ts       # Current user
│       │   └── logout/route.ts   # Logout
│       ├── skills/
│       │   ├── route.ts          # List / Create skills
│       │   └── [id]/
│       │       ├── route.ts      # Get / Delete skill
│       │       ├── comments/route.ts
│       │       ├── download/route.ts
│       │       └── rating/route.ts
│       └── admin/
│           ├── users/route.ts
│           └── audit-log/route.ts
├── components/
│   ├── auth-provider.tsx
│   ├── header.tsx
│   └── skill-card.tsx
├── lib/
│   ├── db.ts        # SQLite database
│   ├── oss.ts       # Alibaba Cloud OSS
│   ├── session.ts   # Iron session
│   └── audit.ts     # Audit logging
└── types/
    └── ali-oss.d.ts
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/leviathanwang90-debug/skillhub.git
cd skillhub

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Create data directory
mkdir -p data logs

# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

### Environment Variables

See `.env.example` for all required environment variables.

### Deployment with PM2

```bash
# Build the project
pnpm build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

## License

Apache-2.0
