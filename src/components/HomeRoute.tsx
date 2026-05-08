import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingAnimation from './LoadingAnimation';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

export default function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><LoadingAnimation /></div>}>
      {user ? <DashboardPage /> : <LandingPage />}
    </Suspense>
  );
}
