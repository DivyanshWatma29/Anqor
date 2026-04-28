import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, type LinkProps, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardFooter from "@/components/DashboardFooter";
import { LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import LoadingAnimation from "@/components/LoadingAnimation";
import PageWrapper from "@/components/PageWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomeRoute from "@/components/HomeRoute";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy load pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PredictPage = lazy(() => import("./pages/PredictPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const BulkCheckPage = lazy(() => import("./pages/BulkCheckPage"));
const ClaimDetailPage = lazy(() => import("./pages/ClaimDetailPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Intent-based prefetching component
export const PrefetchLink = ({ to, children, ...props }: LinkProps) => {
  const prefetch = () => {
    const route = to.toString();
    if (route === "/") {
      import("./pages/DashboardPage");
      import("./pages/LandingPage");
    }
    else if (route === "/predict") import("./pages/PredictPage");
    else if (route === "/analytics") import("./pages/AnalyticsPage");
    else if (route === "/about") import("./pages/AboutPage");
    else if (route === "/bulk-check") import("./pages/BulkCheckPage");
  };

  return (
    <Link to={to} onMouseEnter={prefetch} onTouchStart={prefetch} {...props}>
      {children}
    </Link>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <ErrorBoundary>
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><LoadingAnimation /></div>}>
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
              <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
              <Route path="/predict" element={<PageWrapper><PredictPage /></PageWrapper>} />
              <Route path="/bulk-check" element={<PageWrapper><BulkCheckPage /></PageWrapper>} />

              {/* Home: Landing for guests, Dashboard for logged-in */}
              <Route path="/" element={<PageWrapper><HomeRoute /></PageWrapper>} />

              {/* Protected routes (require login) */}
              <Route path="/analytics" element={<ProtectedRoute><PageWrapper><AnalyticsPage /></PageWrapper></ProtectedRoute>} />
              <Route path="/claims/:id" element={<ProtectedRoute><PageWrapper><ClaimDetailPage /></PageWrapper></ProtectedRoute>} />

              <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
        </ErrorBoundary>
      </main>
      {!isAuthPage && <DashboardFooter />}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="fraudshield-theme">
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LazyMotion features={domAnimation}>
          <BrowserRouter>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <SpeedInsights />
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </LazyMotion>
      </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
