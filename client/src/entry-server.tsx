import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Router } from 'wouter';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Static location hook for SSR
const staticLocationHook = () => {
  return ["/", () => {}];
};

export function render(url: string) {
  // Create a new QueryClient instance for each request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
  
  // Render app to string
  const appHtml = ReactDOMServer.renderToString(
    <Router hook={staticLocationHook}>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </QueryClientProvider>
    </Router>
  );

  // Dehydrate the cache
  const dehydratedState = JSON.stringify(queryClient.getQueryCache().getAll().map(query => ({
    queryKey: query.queryKey,
    data: query.state.data
  })));

  // Generate the full HTML document
  const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${generateMetaTags(url)}
        ${generateStructuredData(url)}
        ${extractCriticalCss()}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script>
          window.__REACT_QUERY_STATE__ = ${dehydratedState};
          // Initialize theme
          const theme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          document.documentElement.classList.add(theme);
        </script>
      </head>
      <body>
        <div id="root">${appHtml}</div>
        <script type="module" src="/src/entry-client.tsx"></script>
      </body>
    </html>`;

  return html;
}

function generateMetaTags(url: string): string {
  const metaTags = {
    title: 'Visual HTML Editor - Modern Web Development Tool',
    description: 'A cutting-edge, browser-based Visual HTML Editor that revolutionizes web content creation through an innovative and powerful development environment.',
    keywords: 'HTML editor, visual editor, web development, drag and drop, modern UI',
    author: 'Visual HTML Editor Team',
    'og:type': 'website',
    'og:url': `https://domain.com${url}`,
    'og:title': 'Visual HTML Editor - Modern Web Development Tool',
    'og:description': 'Create stunning web content visually with our modern HTML editor. Features include real-time preview, drag-and-drop interface, and responsive design tools.',
    'og:image': 'https://domain.com/og-image.png',
    'twitter:card': 'summary_large_image',
    'twitter:title': 'Visual HTML Editor',
    'twitter:description': 'Create stunning web content visually with our modern HTML editor.',
    'twitter:image': 'https://domain.com/twitter-card.png',
  };

  if (url === '/editor') {
    return generateEditorMetaTags();
  }

  return Object.entries(metaTags)
    .map(([key, value]) => {
      if (key === 'title') {
        return `<title>${value}</title>`;
      }
      const property = key.startsWith('og:') || key.startsWith('twitter:')
        ? 'property'
        : 'name';
      return `<meta ${property}="${key}" content="${value}">`;
    })
    .join('\n        ');
}

function generateEditorMetaTags(): string {
  return `
        <title>Visual HTML Editor - Web Editor</title>
        <meta name="robots" content="noindex,nofollow">
        <meta name="description" content="Visual HTML Editor - Create and edit web content visually">`;
}

function generateStructuredData(url: string): string {
  if (url === '/editor') return '';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Visual HTML Editor',
    applicationCategory: 'DeveloperApplication',
    description: 'A cutting-edge, browser-based Visual HTML Editor that revolutionizes web content creation.',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    features: [
      'Real-time preview',
      'Drag and drop interface',
      'Responsive design tools',
      'Code export',
      'Theme customization'
    ]
  };

  return `
        <script type="application/ld+json">
          ${JSON.stringify(structuredData, null, 2)}
        </script>`;
}

function extractCriticalCss(): string {
  return `
        <style>
          :root {
            color-scheme: light dark;
          }
          body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          #root {
            min-height: 100vh;
          }
          .preload * {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -ms-transition: none !important;
            -o-transition: none !important;
            transition: none !important;
          }
        </style>`;
}
