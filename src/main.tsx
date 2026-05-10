import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initFrontendMonitoring } from "./lib/monitoring";
import { initQueryPersistence } from "./lib/queryClient";
import { initAnalytics } from "./lib/analytics";

initFrontendMonitoring();
initQueryPersistence();
initAnalytics();

// Register service worker for push notifications
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
