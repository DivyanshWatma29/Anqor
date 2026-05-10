import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, ArrowLeft, Mail, Database, Lock, Cookie, Globe } from "lucide-react";

const PrivacyPolicyPage = () => {
  const lastUpdated = "May 8, 2026";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                <p>When you create an account, we collect:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Email address</li>
                  <li>Name (optional, from OAuth providers)</li>
                  <li>Profile information (if provided)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
                <p>We automatically collect:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Claim data you submit for analysis</li>
                  <li>Prediction results and analytics</li>
                  <li>Device information and IP address</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Cookies & Tracking</h3>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Keep you logged in (authentication cookies)</li>
                  <li>Remember your preferences (theme, language)</li>
                  <li>Analyze site usage (anonymized analytics)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain our claim verification services</li>
                <li>Process and analyze claims you submit</li>
                <li>Authenticate you and secure your account</li>
                <li>Send you service-related notifications</li>
                <li>Improve our AI models and prediction accuracy</li>
                <li>Comply with legal obligations</li>
              </ul>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Note:</strong> We do not sell your personal information to third parties.
                  We use Supabase (hosted in the EU) for data storage, which complies with GDPR requirements.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                3. Data Storage & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Where We Store Data</h3>
                <p>
                  Your data is stored in Supabase databases hosted in the European Union (EU).
                  This ensures compliance with GDPR and EU data protection laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Security Measures</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>All data is encrypted in transit (TLS/SSL)</li>
                  <li>Passwords are hashed using industry-standard algorithms</li>
                  <li>Row Level Security (RLS) ensures data isolation</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication required for all data access</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Data Retention</h3>
                <p>We retain your data only as long as necessary:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Account data:</strong> Until you delete your account</li>
                  <li><strong>Claim history:</strong> 3 years after last activity (or account deletion)</li>
                  <li><strong>Analytics data:</strong> Anonymized after 2 years</li>
                  <li><strong>Logs:</strong> Deleted after 90 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                4. Cookies & Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p>Required for the site to function properly:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">sb-*</code> - Supabase authentication</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">anqor-theme</code> - Your theme preference</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                <p>We use Vercel Speed Insights for anonymized performance monitoring. This data cannot identify you personally.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Managing Cookies</h3>
                <p>
                  You can control cookies through your browser settings. However, disabling essential cookies
                  may prevent the site from functioning properly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                5. Your Rights (GDPR & CCPA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Depending on your location, you have the following rights:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Access & Portability</h3>
                  <p className="text-sm">Request a copy of your personal data in a machine-readable format.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Rectification</h3>
                  <p className="text-sm">Correct inaccurate or incomplete personal data.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Erasure (Right to be Forgotten)</h3>
                  <p className="text-sm">Request deletion of your personal data and account.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Restrict Processing</h3>
                  <p className="text-sm">Limit how we use your personal data.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Object to Processing</h3>
                  <p className="text-sm">Opt-out of certain data processing activities.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Withdraw Consent</h3>
                  <p className="text-sm">Withdraw previously given consent at any time.</p>
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Exercise Your Rights:</strong> To exercise any of these rights, please contact us at{' '}
                  <a href="mailto:privacy@anqor.com" className="text-primary hover:underline">privacy@anqor.com</a>{' '}
                  or use the data deletion request feature in your account settings. We will respond within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Supabase:</strong> Database and authentication hosting (EU-based, GDPR compliant)
                </li>
                <li>
                  <strong>Resend:</strong> Email delivery service (only your email address is shared)
                </li>
                <li>
                  <strong>Vercel:</strong> Hosting and analytics (anonymized data only)
                </li>
                <li>
                  <strong>Google/GitHub:</strong> OAuth authentication (only public profile info)
                </li>
              </ul>
              <p className="text-sm italic">
                Each service has its own privacy policy governing how they handle your data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Our service is not intended for children under the age of 16. We do not knowingly collect
                personal information from children under 16. If you believe we have collected such information,
                please contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We retain your data only as long as necessary:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account data:</strong> Until you delete your account or 2 years of inactivity</li>
                <li><strong>Claim data:</strong> Until account deletion or 2 years after last login</li>
                <li><strong>Analytics data:</strong> Anonymized after 12 months</li>
                <li><strong>Log data:</strong> Automatically deleted after 30 days</li>
                <li><strong>Backup data:</strong> Deleted within 30 days of account deletion</li>
              </ul>
              <p className="text-sm mt-4">
                You can request immediate deletion of your data using the GDPR deletion request feature in your account settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the "Last updated" date. Significant changes
                will be communicated via email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                10. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                If you have any questions about this Privacy Policy or your data, please contact us:
              </p>
              <ul className="list-none pl-0 mt-4 space-y-2">
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@anqor.com" className="text-primary hover:underline">privacy@anqor.com</a>
                </li>
                <li>
                  <strong>Data Protection Officer:</strong>{' '}
                  <a href="mailto:dpo@anqor.com" className="text-primary hover:underline">dpo@anqor.com</a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Anqor. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;