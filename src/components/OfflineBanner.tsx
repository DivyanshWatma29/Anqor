import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/lib/network';

export default function OfflineBanner() {
  const { isOnline, queueSize } = useNetworkStatus();

  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-warning/20 bg-warning/10 text-warning backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          {isOnline ? <RefreshCw className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span>
            {isOnline
              ? `Back online. Syncing ${queueSize} queued action${queueSize === 1 ? '' : 's'}...`
              : 'You are offline. Cached data is available and new actions will be queued.'}
          </span>
        </div>
        {queueSize > 0 && <span className="text-xs opacity-90">Queued: {queueSize}</span>}
      </div>
    </div>
  );
}
