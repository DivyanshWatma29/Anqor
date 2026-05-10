import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft, Scale, AlertTriangle, Ban, Gavel } from "lucide-react";

const TermsOfServicePage = () => {
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
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                By accessing or using Anqor's claim verification services ("Service"), you agree to be bound by these
                Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p>
                These Terms apply to all users, including visitors, registered users, and administrators.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Anqor provides AI-powered claim verification services that analyze text claims and provide
                credibility assessments. Our Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Single claim analysis and prediction</li>
                <li>Bulk claim processing</li>
                <li>Historical claim tracking and analytics</li>
                <li>API access for approved integrations</li>
              </ul>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Important:</strong> Our AI predictions are provided for informational purposes only.
                  They do not constitute professional advice, fact-checking guarantees, or legal opinions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Registration</h3>
                <p>To use certain features, you must register for an account. You agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your password</li>
                  <li>Notify us immediately of unauthorized account use</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Types</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Free Account:</strong> Limited claims per month, basic analytics</li>
                  <li><strong>Premium Account:</strong> Higher limits, advanced analytics (subject to separate agreement)</li>
                  <li><strong>Admin Account:</strong> Platform management (by invitation only)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                4. Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any illegal purpose or in violation of laws</li>
                <li>Submit false, defamatory, or harassing claims about individuals</li>
                <li>Attempt to reverse-engineer or copy our AI models</li>
                <li>Exceed rate limits or attempt to overload our systems</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to spam, phish, or distribute malware</li>
                <li>Scrape or harvest data from the Service without permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Property</h3>
                <p>
                  The Service, including its original content, features, and functionality, is owned by Anqor
                  and is protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Content</h3>
                <p>
                  You retain ownership of claims you submit. By submitting claims, you grant us a non-exclusive,
                  royalty-free license to process and analyze your content for service provision.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI Output</h3>
                <p>
                  Predictions and analysis results are provided for your use. However, the underlying AI models
                  and algorithms remain our proprietary technology.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                6. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                To the maximum extent permitted by law, Anqor shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your use of the Service.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>We do not guarantee 100% accuracy of AI predictions</li>
                <li>We are not responsible for decisions made based on our predictions</li>
                <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
                <li>We provide the Service "as is" without warranties of any kind</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We may terminate or suspend your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees (for paid accounts)</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p>
                Upon termination, your right to use the Service ceases immediately. Data retention
                follows our Privacy Policy and applicable laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes
                via email or through the Service. Your continued use after changes constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                9. Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States,
                without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising under these Terms shall be subject to the exclusive jurisdiction
                of the courts located in the United States.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>For questions about these Terms, please contact us:</p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> legal@anqor.com</li>
                <li><strong>Address:</strong> Anqor Legal Department, 123 Main St, Suite 100, San Francisco, CA 94105</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            By using Anqor, you acknowledge that you have read and understood these Terms of Service.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
