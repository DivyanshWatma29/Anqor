import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
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
import OfflineBanner from "@/components/OfflineBanner";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { NetworkProvider, useNetworkStatus } from "@/lib/network";
import { flushOfflineQueue, getOfflineQueue } from "@/lib/offlineQueue";
import { createBatch, predictClaim } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import CookieConsentBanner from "@/components/CookieConsent";

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
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

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
    else if (route === "/admin") import("./pages/AdminPage");
    else if (route === "/forgot-password") import("./pages/ForgotPasswordPage");
    else if (route === "/reset-password") import("./pages/ResetPasswordPage");
  };

  return (
    <Link to={to} onMouseEnter={prefetch} onTouchStart={prefetch} {...props}>
      {children}
    </Link>
  );
};

function OfflineSyncManager() {
  const { isOnline, setQueueSize } = useNetworkStatus();

  useEffect(() => {
    setQueueSize(getOfflineQueue().length);
  }, [setQueueSize]);

  useEffect(() => {
    if (!isOnline) return;

    const sync = async () => {
      const completed = await flushOfflineQueue({
        predictClaim: (payload) => predictClaim(payload as Record<string, string | number | boolean>),
        createBatch: (payload) => {
          const data = payload as { claims: Record<string, string | number | boolean>[]; claimCategory: string };
          return createBatch(data.claims, data.claimCategory);
        },
      });

      if (completed.length > 0) {
        await queryClient.invalidateQueries();
      }

      setQueueSize(getOfflineQueue().length);
    };

    void sync();
  }, [isOnline, setQueueSize]);

  return null;
}

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <OfflineBanner />
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><LoadingAnimation /></div>}>
<Routes location={location} key={location.pathname}>
  <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
  <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
  <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
  <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
  <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
  <Route path="/predict" element={<PageWrapper><PredictPage /></PageWrapper>} />
  <Route path="/bulk-check" element={<PageWrapper><BulkCheckPage /></PageWrapper>} />
  <Route path="/" element={<PageWrapper><HomeRoute /></PageWrapper>} />
  <Route path="/analytics" element={<ProtectedRoute><PageWrapper><AnalyticsPage /></PageWrapper></ProtectedRoute>} />
  <Route path="/claims/:id" element={<ProtectedRoute><PageWrapper><ClaimDetailPage /></PageWrapper></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminPage /></PageWrapper></ProtectedRoute>} />
  <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
</Routes>
            </Suspense>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
        {!isAuthPage && <DashboardFooter />}
        <CookieConsentBanner />
      </div>
    );
  };

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="anqor-theme">
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <TooltipProvider>
            <LazyMotion features={domAnimation}>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                  <OfflineSyncManager />
                  <Toaster />
                  <Sonner />
                  <SpeedInsights />
                  <AnalyticsTracker />
                  <AppContent />
                </AuthProvider>
              </BrowserRouter>
            </LazyMotion>
          </TooltipProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
