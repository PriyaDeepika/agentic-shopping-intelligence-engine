[![Fashion Ecommerce Screenshot](public/Fashion%20Ecommerce.png)](https://fashion-ecommerce-gilt.vercel.app/)

# Fashion Ecommerce - Next.js E-commerce Application

Fashion Ecommerce is an open-source, modern e-commerce front-end application built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Redux Toolkit**, **Framer Motion**, and **ShadCN UI**. This project converts a Figma design into a fully responsive, production-ready application following industry best practices for performance, SEO, and accessibility.

## Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Project Structure](#project-structure)
- [Chrome DevTools Configuration](#chrome-devtools-configuration)
- [Performance Optimizations](#performance-optimizations)
- [State Management](#state-management)
- [Styling & UI Components](#styling--ui-components)
- [API & Data Management](#api--data-management)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Issues](#issues)
- [License](#license)
- [Contact](#contact)

## Overview

Fashion Ecommerce is a comprehensive e-commerce solution that demonstrates modern web development practices. The project showcases:

- **Design-to-Code Implementation**: Converting Figma designs to production-ready React components
- **Modern Architecture**: Using Next.js 14 App Router with TypeScript for type safety
- **State Management**: Redux Toolkit for managing shopping cart and application state
- **Performance**: Optimized for Core Web Vitals and user experience
- **Accessibility**: WCAG 2.1 compliant components and navigation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Demo

🚀 **Live Demo**: [https://fashion-ecommerce-gilt.vercel.app/](https://fashion-ecommerce-gilt.vercel.app/)

## Features

### Core Features
- ✅ **Product Catalog**: Browse products with filtering and search
- ✅ **Shopping Cart**: Add, remove, and manage cart items with Redux
- ✅ **Product Details**: Detailed product pages with image galleries
- ✅ **Responsive Design**: Optimized for all device sizes
- ✅ **Search & Filter**: Advanced product filtering capabilities
- ✅ **User Reviews**: Product rating and review system

### Technical Features
- ✅ **Server-Side Rendering (SSR)**: Fast page loads and SEO optimization
- ✅ **Static Site Generation (SSG)**: Pre-rendered pages for better performance
- ✅ **TypeScript**: Full type safety across the application
- ✅ **Redux Toolkit**: Modern state management with RTK Query
- ✅ **Framer Motion**: Smooth animations and micro-interactions
- ✅ **ShadCN UI**: Accessible and customizable component library
- ✅ **Chrome DevTools Integration**: Enhanced debugging experience
- ✅ **Hot Module Replacement**: Fast development workflow
- ✅ **Code Splitting**: Optimized bundle sizes

## Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 14.2.30 | React framework with SSR/SSG |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| **State Management** | Redux Toolkit | 2.2.7 | Predictable state container |
| **UI Library** | ShadCN UI | Latest | Accessible component library |
| **Animations** | Framer Motion | 11.5.4 | Motion library for React |
| **Icons** | Lucide React | 0.438.0 | Beautiful icon library |
| **Build Tool** | Webpack | Built-in | Module bundler |

### Development Dependencies
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Installation

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm package manager
- Git

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NafisRayan/Fashion-Ecommerce.git
   cd Fashion-Ecommerce
   ```

2. **Install dependencies:**
   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using pnpm
   pnpm install
   ```

3. **Run the development server:**
   ```bash
   # Using npm
   npm run dev

   # Using yarn
   yarn dev

   # Using pnpm
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Development

### Chrome DevTools Configuration

This project includes enhanced Chrome DevTools support with a custom endpoint that resolves the common 404 error:

- **Endpoint**: `/.well-known/appspecific/com.chrome.devtools.json`
- **Purpose**: Provides Chrome DevTools with application-specific debugging configuration
- **Features**: WebSocket debugging, source maps, and enhanced development experience

### Hot Module Replacement

The development server includes HMR for instant feedback:
- CSS changes apply immediately
- Component updates preserve state
- Redux state persists across reloads

### Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── cart/              # Cart pages
│   └── shop/              # Product pages
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   ├── common/           # Shared components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utilities and configuration
│   ├── features/         # Redux slices
│   ├── hooks/            # Custom hooks
│   └── utils.ts          # Helper functions
└── styles/               # Global styles and fonts
```

## Project Structure

```
Fashion Ecommerce/
├── public/                     # Static assets
│   ├── icons/                 # SVG icons
│   └── images/                # Product images
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Homepage
│   │   ├── cart/              # Shopping cart pages
│   │   ├── shop/              # Product catalog
│   │   └── .well-known/       # Chrome DevTools config
│   ├── components/
│   │   ├── ui/               # ShadCN UI components
│   │   │   ├── button.tsx    # Button component
│   │   │   ├── input.tsx     # Input component
│   │   │   └── ...           # Other UI components
│   │   ├── common/           # Shared components
│   │   │   ├── ProductCard.tsx
│   │   │   └── ReviewCard.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar/       # Navigation
│   │   │   └── Footer/       # Footer
│   │   ├── homepage/         # Homepage sections
│   │   ├── product-page/     # Product detail components
│   │   ├── cart-page/        # Cart components
│   │   └── shop-page/        # Shop filtering components
│   ├── lib/
│   │   ├── features/         # Redux slices
│   │   │   ├── carts/        # Cart state management
│   │   │   └── products/     # Product state
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store.ts          # Redux store configuration
│   │   └── utils.ts          # Utility functions
│   ├── styles/
│   │   ├── globals.css       # Global styles
│   │   └── fonts/            # Custom font files
│   └── types/                # TypeScript type definitions
├── components.json            # ShadCN UI configuration
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Chrome DevTools Configuration

### Enhanced Debugging Experience

The project includes a custom Chrome DevTools configuration that provides:

1. **WebSocket Debugging**: Direct connection to the development server
2. **Source Maps**: Enhanced debugging with original source code
3. **Hot Module Replacement**: Live reloading support
4. **Network Inspection**: Detailed request/response monitoring

### Configuration Details

- **File**: `src/app/.well-known/appspecific/com.chrome.devtools.json/route.ts`
- **Endpoint**: `/.well-known/appspecific/com.chrome.devtools.json`
- **Response**: JSON configuration for Chrome DevTools integration

## Performance Optimizations

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: Optimized with image lazy loading
- **FID (First Input Delay)**: Minimized with code splitting
- **CLS (Cumulative Layout Shift)**: Prevented with size reservations

### Bundle Optimization
- Tree shaking for unused code elimination
- Dynamic imports for route-based code splitting
- Webpack optimizations for smaller bundles

### Image Optimization
- Next.js Image component for automatic optimization
- WebP format support with fallbacks
- Responsive images with srcSet

## State Management

### Redux Toolkit Setup

```typescript
// Store configuration
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    products: productsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
```

### Cart Management
- Add/remove products
- Update quantities
- Calculate totals
- Persist across sessions

## Styling & UI Components

### Tailwind CSS Configuration
- Custom color palette
- Responsive breakpoints
- Typography scale
- Animation utilities

### ShadCN UI Components
- Accessible by default
- Customizable themes
- TypeScript support
- Radix UI primitives

### Component Library
- Button variants and sizes
- Form components
- Navigation elements
- Layout utilities

## API & Data Management

### Data Flow
1. **Static Data**: Product information and images
2. **Client State**: Shopping cart and UI state
3. **Server State**: Future API integration ready

### Type Safety
```typescript
// Product type definition
interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  category: string;
  rating: number;
  reviews: Review[];
}
```

## Testing

### Testing Strategy
- Unit tests for utility functions
- Component testing with React Testing Library
- E2E testing setup ready

### Future Testing Implementation
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test
```

## Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

**1. Chrome DevTools 404 Error**
- ✅ **Fixed**: Custom endpoint resolves `.well-known/appspecific/com.chrome.devtools.json`

**2. Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

**3. Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**4. TypeScript Errors**
```bash
# Type checking
npx tsc --noEmit

# Fix common issues
npm run lint --fix
```

### Development Tips

1. **Hot Reload Issues**: Restart the dev server
2. **CSS Not Updating**: Check Tailwind CSS configuration
3. **Redux DevTools**: Install browser extension for debugging
4. **Performance**: Use Next.js built-in analytics

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for functions
- Update tests and documentation

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Updated existing tests

## Screenshots
Add screenshots for UI changes
```

## Issues

### Reporting Bugs
When reporting bugs, please include:
- Browser and version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

### Feature Requests
- Describe the feature
- Explain the use case
- Provide examples if possible

## Roadmap

### Upcoming Features
- [ ] User authentication
- [ ] Payment integration
- [ ] Wishlist functionality
- [ ] Product recommendations
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Progressive Web App (PWA)

### Technical Improvements
- [ ] Unit test coverage
- [ ] E2E test suite
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Analytics integration

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

```
MIT License

Copyright (c) 2024 Nafis Rayan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Contact

**Nafis Rayan**
- 📧 Email: [nafisrayan123@gmail.com](mailto:nafisrayan123@gmail.com)
- 🐙 GitHub: [https://github.com/NafisRayan](https://github.com/NafisRayan)
- 🌐 Website: [Portfolio](https://nafisrayan.vercel.app)

---

## Acknowledgments

- **Design Credit**: [Hamza Naeem](https://www.figma.com/@hamzauix) for the original Figma design
- **Figma File**: [E-commerce Website Template](https://www.figma.com/community/file/1273571982885059508/e-commerce-website-template-freebie)
- **Community**: Thanks to all contributors and users

---

**⭐ If you found this project helpful, please give it a star!**

**🚀 Ready to build something amazing? Fork this repository and start coding!**
