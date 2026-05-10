/**
 * Email templates with unsubscribe links (legal requirement)
 * All marketing emails include unsubscribe link in footer
 */

const BASE_URL = process.env.APP_URL || 'http://localhost:5173';

export function getPasswordResetEmail(resetUrl, name) {
  return {
    subject: 'Reset Your Password - Anqor',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 20px; background: white; }
          .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .footer a { color: #667eea; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5;">
        <div class="container">
          <div class="header">
            <h1>Anqor Insurance</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser:<br>${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© 2026 Anqor Insurance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name || 'there'},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`
  };
}

export function getWelcomeEmail(name, email) {
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${generateUnsubscribeToken(email)}`;
  return {
    subject: 'Welcome to Anqor!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 20px; background: white; }
          .feature { padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .footer a { color: #667eea; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5;">
        <div class="container">
          <div class="header">
            <h1>Welcome to Anqor!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'},</h2>
            <p>Welcome to Anqor Insurance! We're excited to have you on board.</p>
            <p>With Anqor, you can:</p>
            <div class="feature">🔍 <strong>Instant Fraud Detection</strong> - Analyze claims in seconds</div>
            <div class="feature">📊 <strong>Detailed Analytics</strong> - Understand risk factors</div>
            <div class="feature">📄 <strong>Document Processing</strong> - Extract data from claim forms</div>
            <p>Get started by making your first prediction!</p>
          </div>
          <div class="footer">
            <p>© 2026 Anqor Insurance. All rights reserved.</p>
            <p><a href="${unsubscribeUrl}">Unsubscribe from marketing emails</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Anqor!\n\nGet started: ${BASE_URL}\n\nUnsubscribe: ${unsubscribeUrl}`
  };
}

export function getClaimAlertEmail(name, claimId, prediction, riskScore) {
  return {
    subject: `Claim Alert: ${prediction} Detected`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: sans-serif; }
          .header { background: ${prediction === 'Fraud' ? '#dc2626' : '#16a34a'}; padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: white; }
          .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background: ${prediction === 'Fraud' ? '#dc2626' : '#16a34a'}; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Claim Analysis Complete</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'},</h2>
            <p>Your claim <strong>${claimId}</strong> has been analyzed:</p>
            <p><span class="badge">${prediction}</span> with ${riskScore}% risk score</p>
            <p>Log in to view the full report.</p>
          </div>
          <div class="footer">
            <p>© 2026 Anqor Insurance.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Claim ${claimId}: ${prediction} detected with ${riskScore}% risk.`
  };
}

/**
 * Generate unsubscribe token (simple HMAC-like token for demo)
 * In production, use proper JWT or signed token
 */
function generateUnsubscribeToken(email) {
  // Simple base64 encoded email with timestamp for demo
  // In production, use crypto.sign() or JWT
  const data = `${email}:${Date.now()}:${process.env.UNSUBSCRIBE_SECRET || 'secret'}`;
  return Buffer.from(data).toString('base64url');
}

export function verifyUnsubscribeToken(token, email) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [tokenEmail, timestamp, secret] = decoded.split(':');
    if (tokenEmail !== email) return false;
    if (secret !== (process.env.UNSUBSCRIBE_SECRET || 'secret')) return false;
    // Token valid for 30 days
    if (Date.now() - parseInt(timestamp) > 30 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}
