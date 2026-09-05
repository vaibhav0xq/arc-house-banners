import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Home } from '@/pages/Home';
import { useStudio } from '@/store/use-studio';
import { getCountry } from '@workspace/papercut-core';

const queryClient = new QueryClient();

function ThemeProvider({ children }: { children: ReactNode }) {
  const countrySlug = useStudio((s) => s.countrySlug);
  const country = getCountry(countrySlug);
  
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ink', country.ink);
    root.style.setProperty('--tag', country.tag);
    root.style.setProperty('--swatch', country.swatch);
    root.style.setProperty('--foreground', country.ink);
  }, [country]);
  
  return <>{children}</>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
