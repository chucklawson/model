# Installation Guide

Developer guide for setting up the Investment Portfolio Manager for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git** for version control
- **AWS Account** for Amplify backend services
- **Financial Modeling Prep API Key** for market data

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd model
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and React Router
- AWS Amplify libraries
- Tailwind CSS
- Recharts for visualization
- Three.js for 3D graphics
- TypeScript and development tools

### 3. Configure Environment

Create a `.env` file in the project root (if needed for local configuration). See `.env.example` for reference.

### 4. Set Up AWS Amplify Backend

```bash
npx ampx sandbox
```

This will:
- Deploy the backend to AWS
- Set up authentication (Cognito)
- Configure the database (DynamoDB)
- Deploy serverless functions (Lambda)

### 5. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Build for Production

### Build the Application

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## AWS Amplify Deployment

The application is configured for AWS Amplify hosting.

### Deploy to Amplify

1. Connect your repository to AWS Amplify
2. Configure build settings (already in `amplify.yml`)
3. Deploy automatically on git push

Or deploy manually:

```bash
npx ampx sandbox --deploy
```

## Project Structure

```
model/
├── src/              # Source code
│   ├── Pages/       # Page components
│   ├── Components/  # Reusable components
│   ├── hooks/       # Custom React hooks
│   ├── utils/       # Utility functions
│   └── types/       # TypeScript types
├── public/          # Static assets
├── amplify/         # AWS Amplify backend config
├── docs/            # User documentation
└── dist/            # Build output (generated)
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
npm run dev -- --port 3000
```

### Amplify Backend Issues

Reset the backend:

```bash
npx ampx sandbox delete
npx ampx sandbox
```

### Dependency Issues

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Related Documentation

- [First-Time Setup](first-time-setup.md) - User account setup
- [Quick Start Guide](quick-start-guide.md) - Getting started
