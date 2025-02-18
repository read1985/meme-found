# Solana Raydium Coin Alert Service

A real-time monitoring and alert system for new coins launched on Raydium DEX, built with Next.js and deployed on Vercel.

## 🚀 Features

- Real-time coin monitoring
- Custom alert creation
- Interactive dashboard
- Smart contract analysis
- Liquidity pool tracking
- Token distribution analysis
- Email notifications
- User authentication
- Mobile responsive design

## 🛠 Tech Stack

- **Framework:** Next.js 13+ (App Router)
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Edge Functions
- **Database:** Vercel Postgres
- **Blockchain:** Solana Web3.js, Raydium SDK
- **Authentication:** NextAuth.js
- **Real-time:** WebSocket
- **Deployment:** Vercel

## 📦 Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard routes
│   ├── alerts/           # Alert management
│   └── api/              # Backend API routes
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── types/            # TypeScript types
│   ├── blockchain/       # Solana/Raydium integration
│   ├── db/               # Database utilities
│   └── utils/            # Helper functions
├── services/             # Business logic
└── styles/               # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Solana CLI tools
- Vercel account

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meme-found.git
cd meme-found
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
DATABASE_URL=your_vercel_postgres_url
NEXT_PUBLIC_SOLANA_RPC_URL=your_solana_rpc_url
NEXT_PUBLIC_RAYDIUM_API_URL=your_raydium_api_url
```

5. Run the development server:
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: Vercel Postgres connection string
- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint
- `NEXT_PUBLIC_RAYDIUM_API_URL`: Raydium API endpoint
- `SMTP_SERVER`: Email service configuration
- `JWT_SECRET`: Authentication secret

### Database Setup

1. Create a Vercel Postgres database
2. Run migrations:
```bash
pnpm db:migrate
```

## 📝 API Documentation

### Endpoints

- `GET /api/coins`: Fetch recent coins
- `POST /api/alerts`: Create new alert
- `GET /api/alerts`: List user alerts
- `PUT /api/alerts/:id`: Update alert
- `DELETE /api/alerts/:id`: Delete alert

Full API documentation available in `/docs/api.md`

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy!

```bash
vercel --prod
```

### Environment Setup

1. Add required environment variables in Vercel dashboard
2. Configure Vercel Postgres
3. Set up Vercel Cron for scheduled tasks
4. Enable Edge Functions where needed

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e
```

## 🔍 Monitoring

- Vercel Analytics Dashboard
- Error tracking via Sentry
- Performance monitoring
- Database metrics
- API endpoint health checks

## 🔒 Security

- Rate limiting on API routes
- Input validation
- CSRF protection
- Secure headers
- Regular security updates
- Data encryption

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For support, email support@yourproject.com or join our Discord channel.

## 🙏 Acknowledgments

- Solana Foundation
- Raydium Team
- Vercel
- Next.js Team 