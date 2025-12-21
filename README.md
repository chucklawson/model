# Investment Portfolio Manager

A comprehensive web application for tracking and analyzing your investment portfolio with real-time market data, advanced analytics, and powerful research tools.

## Features

### Portfolio Tracking & Management
- **Real-Time Quotes** - Live stock prices with after-hours data
- **Multi-Portfolio Support** - Organize investments by account, strategy, or sector
- **Lot-Level Tracking** - Track individual purchase lots with separate cost bases
- **CSV Import/Export** - Bulk import positions and export for analysis
- **Dividend Tracking** - Monitor dividend income and reinvestments

### Research & Analysis
- **Stock News** - Search company-specific news and market updates
- **Treasury Yields** - Compare current treasury rates and historical data
- **Key Metrics** - Analyze company financials and quarterly reports
- **Performance Tracking** - Monitor daily and total portfolio performance

### Financial Calculators
- **P/E Growth Calculator** - Evaluate stock valuations based on growth rates
- **Rule of 72** - Calculate investment doubling time
- **Mortgage Calculator** - Plan home purchases with taxes, insurance, and PMI

### Security & Cloud Storage
- **AWS Amplify Authentication** - Secure, cloud-based user accounts
- **DynamoDB Storage** - Reliable, scalable data persistence
- **Server-Side API Key Storage** - Encrypted, secure API key management

## Quick Start

### 1. Sign Up
Create your account using the secure AWS Amplify authentication system.

### 2. Configure API Access
Get a free API key from [Financial Modeling Prep](https://financialmodelingprep.com/) and add it in Settings. The free tier (250 requests/day) is perfect for most users.

### 3. Import Your Portfolio
- **Option A:** Import via CSV for bulk loading
- **Option B:** Manually add positions one at a time

### 4. Explore Features
Navigate through Tickers, Research, Calculators, and Key Metrics pages to analyze your investments.

## Documentation

Comprehensive documentation is available in-app via the **Help** page and in the `docs/` folder:

- [Quick Start Guide](docs/getting-started/quick-start-guide.md) - Get up and running in 5 minutes
- [API Setup Guide](docs/guides/api-setup.md) - Configure Financial Modeling Prep API
- [CSV Import Guide](docs/guides/csv-import.md) - Bulk import your portfolio
- [Portfolio Management](docs/features/portfolio-management.md) - Core features guide
- [Full Documentation](docs/README.md) - Complete documentation index

## Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast development and builds
- Tailwind CSS for modern, responsive design
- React Router for navigation
- Recharts for data visualization
- Three.js for 3D portfolio visualization

**Backend:**
- AWS Amplify Gen 2
- AWS Cognito for authentication
- AWS DynamoDB for data storage
- AWS Lambda for serverless functions

**Data:**
- Financial Modeling Prep API for real-time market data

## Development

### Prerequisites
- Node.js 18+ and npm
- AWS account (for Amplify backend)
- Financial Modeling Prep API key

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd model

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Deploy

This application is configured for AWS Amplify hosting:

```bash
npx ampx sandbox
```

## Support

- **In-App Help:** Click the Help tab in the navigation
- **Troubleshooting:** See [Troubleshooting Guide](docs/reference/troubleshooting.md)
- **API Issues:** See [API Setup Guide](docs/guides/api-setup.md)

## License

Private project - All rights reserved

## About

Investment Portfolio Manager helps individual investors track their portfolios with the same powerful tools used by professionals. Built with modern cloud technologies and real-time market data, it provides a comprehensive solution for portfolio management and analysis.

**Key Benefits:**
- ✅ Track unlimited positions across multiple portfolios
- ✅ Real-time market data and after-hours quotes
- ✅ Secure cloud storage with AWS
- ✅ Powerful research and analysis tools
- ✅ Free to use with your own API key
- ✅ Regular updates and new features

Start managing your investments more effectively today!
