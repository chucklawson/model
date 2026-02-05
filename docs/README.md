# Investment Portfolio Manager - Documentation

Welcome to the comprehensive documentation for the Investment Portfolio Manager application. This guide will help you get started and make the most of all features.

## Quick Links

### Getting Started
- [Quick Start Guide](getting-started/quick-start-guide.md) - Get up and running quickly
- [First-Time Setup](getting-started/first-time-setup.md) - Detailed initial configuration
- [Installation Guide](getting-started/installation.md) - Development setup instructions

### Feature Documentation
- [Portfolio Management](features/portfolio-management.md) - Track and manage your investments on the Tickers page
- [Portfolio Visualization](features/flexible-portfolio.md) - YTD performance, custom range analysis, technical indicators, and charts
- [Research Tools](features/research-tools.md) - Stock news, market news, and treasury yield research
- [Calculators](features/calculators.md) - P/E Growth, Rule of 72, Mortgage, Drawdown, and Bank Metrics calculators
- [Key Metrics](features/key-metrics.md) - Analyze company financial statements and key ratios
- [Historical Dividends](features/historical-dividends.md) - Dividend payment history and yield tracking

### Guides
- [API Setup](guides/api-setup.md) - Configure Financial Modeling Prep API
- [CSV Import](guides/csv-import.md) - Import your portfolio data
- [Portfolio Organization](guides/portfolio-management.md) - Organize multiple portfolios
- [Data Export](guides/export-data.md) - Export your data

### Reference
- [CSV Format Specification](reference/csv-format.md) - Technical CSV format details
- [Troubleshooting](reference/troubleshooting.md) - Common issues and solutions
- [Keyboard Shortcuts](reference/keyboard-shortcuts.md) - Productivity tips

## What is Investment Portfolio Manager?

Investment Portfolio Manager is a comprehensive web application for tracking and analyzing your investment portfolio. Built with modern web technologies and powered by AWS Amplify, it provides real-time stock data, advanced analytics, and powerful research tools.

### Key Features

- **Real-Time Portfolio Tracking** - Monitor your investments with live market data and after-hours quotes
- **Multi-Portfolio Support** - Organize investments across different portfolios (Retirement, Trading, Dividend, etc.)
- **Performance Analytics** - Year-to-date and custom date range performance with four chart types (line, bar, pie, stacked area)
- **Technical Indicators** - Moving averages, Bollinger Bands, RSI, and Stochastic Oscillator
- **CSV Import/Export** - Easily bulk import positions and export your data
- **Stock & Market Research** - Search stock-specific news, browse market news, and compare treasury yields
- **Five Financial Calculators:**
  - **P/E Growth Calculator** - Project stock prices with earnings growth and analyst estimates
  - **Rule of 72** - Learn compound interest with four interactive modes
  - **Mortgage Calculator** - Full analysis with PMI, extra payments, and 5 chart views
  - **Drawdown Calculator** - Retirement withdrawal planning with depletion scenarios
  - **Bank Metrics Calculator** - 13 banking metrics with sector benchmarks and recommendations
- **Key Metrics Analysis** - Analyze company financials with quarterly and annual data
- **Dividend Tracking** - Historical dividend data with current yield display
- **Secure Cloud Storage** - AWS-backed authentication and encrypted data storage

## Need Help?

- **New User?** Start with the [Quick Start Guide](getting-started/quick-start-guide.md)
- **Having Issues?** Check [Troubleshooting](reference/troubleshooting.md)
- **Want to Import Data?** See the [CSV Import Guide](guides/csv-import.md)
- **Need an API Key?** See the [API Setup Guide](guides/api-setup.md)

## Application Pages

| Page | Navigation Tab | Purpose |
|------|---------------|---------|
| Home | Home | Welcome page with 3D globe visualization |
| Tickers | Tickers | Portfolio holdings management, add/edit/delete lots, import/export |
| Portfolios | Portfolios | Visual portfolio performance, YTD and custom range charts, technical indicators |
| News | News | Stock news search, market news, treasury yield comparisons |
| Key Metrics | Key Metrics | Company financial statement analysis with spreadsheet view |
| Calculators | Calculators | P/E Growth, Rule of 72, Mortgage, Drawdown, and Bank Metrics calculators |
| Dividends | Dividends | Historical dividend payment history and yield tracking |
| Settings | Settings | API key configuration |
| Help | Help | In-app documentation |

## Technology Stack

- React 19 with TypeScript
- AWS Amplify (Authentication, Database, Serverless Functions)
- Financial Modeling Prep API for market data
- Tailwind CSS for styling
- Recharts for data visualization
- Three.js for 3D portfolio visualization
