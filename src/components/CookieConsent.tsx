import { useState, useEffect } from "react";
import { Cookie, Settings, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always true - required for site functionality
  analytics: false,
  marketing: false,
};

const COOKIE_CONSENT_KEY = "anqor_cookie_consent";
const COOKIE_PREFERENCES_KEY = "anqor_cookie_preferences";

export function getCookiePreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored) as CookiePreferences;
    }
  } catch (e) {
    console.error("Error reading cookie preferences:", e);
  }
  return null;
}

export function hasConsented(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "true";
}

export function setCookiePreferences(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
  localStorage.setItem(COOKIE_CONSENT_KEY, "true");
}

export function clearCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const saved = getCookiePreferences();
      if (saved) {
        setPreferences(saved);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    setCookiePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
    // Load analytics scripts here
    loadAnalytics();
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    setCookiePreferences(necessaryOnly);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    setCookiePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    if (preferences.analytics) {
      loadAnalytics();
    }
  };

  const handleToggleAnalytics = (checked: boolean) => {
    setPreferences((prev) => ({ ...prev, analytics: checked }));
  };

  const handleToggleMarketing = (checked: boolean) => {
    setPreferences((prev) => ({ ...prev, marketing: checked }));
  };

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-slide-up">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Cookie Notice</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your experience, analyze site usage, and assist in our
                  marketing efforts. By clicking "Accept All", you consent to our use of cookies.{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                  Necessary Only
                </Button>
                <Button size="sm" onClick={handleAcceptAll}>
                  <Check className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Necessary cookies cannot be disabled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="necessary" className="font-medium">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for the site to function properly.
                </p>
              </div>
              <Switch id="necessary" checked={true} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics" className="font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our site.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={handleToggleAnalytics}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing" className="font-medium">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={handleToggleMarketing}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating settings button (shown after consent) */}
      {hasConsented() && !showBanner && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-4 right-4 z-40 p-3 bg-background border rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Cookie Settings"
        >
          <Cookie className="h-5 w-5 text-primary" />
        </button>
      )}
    </>
  );
}

// Helper function to load analytics (implement based on your analytics provider)
function loadAnalytics() {
  // Add your analytics initialization here
  // Example: Google Analytics, PostHog, etc.
  console.log("Analytics cookies accepted - load analytics here");
  
  // Example for Google Analytics:
  // if (window.gtag) {
  //   gtag('consent', 'update', {
  //     'analytics_storage': 'granted'
  //   });
  // }
}

export default CookieConsentBanner;
