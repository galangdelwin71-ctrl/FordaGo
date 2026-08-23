<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FordaGO Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #06080f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #06080f; padding: 32px 16px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #10141e; border: 1px solid #1f2536; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 22px 24px; background: linear-gradient(180deg, #171d2b 0%, #10141e 100%); border-bottom: 1px solid #1c2233;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2.5px; color: #ffffff; text-transform: uppercase; font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;">
                      FORDA<span style="color: #ffd600;">GO</span>
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #8f9bb3; letter-spacing: 0.5px; font-weight: 600;">
                      Stronger Today, <span style="color: #ffd600;">Better Tomorrow.</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              
              <!-- Greeting & Subtitle -->
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #ffffff; text-align: center;">
                Password Reset Request
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #a4b0c6; text-align: center;">
                Hi <strong style="color: #ffffff;">{{ $name ?? 'Member' }}</strong>,<br>
                We received a request to reset the password for your FordaGO account. Use the 6-digit one-time password (OTP) below to proceed:
              </p>

              <!-- 6-Digit OTP Code Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 20px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #171c2a; border: 2px dashed #ffd600; border-radius: 16px; padding: 20px 16px; text-align: center; max-width: 320px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ffd600; margin-bottom: 8px;">
                        YOUR VERIFICATION CODE
                      </div>
                      <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; text-shadow: 0 0 16px rgba(255, 214, 0, 0.35);">
                        {{ $code }}
                      </div>
                      <div style="font-size: 11px; color: #8f9bb3; margin-top: 8px; font-weight: 600;">
                        ⏱️ Expires in 10 minutes
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #7f8ca3; text-align: center;">
                Enter this code into the FordaGO app to choose a new password.
              </p>

              <!-- Security Notice Callout -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; background-color: #161a26; border-radius: 12px; border-left: 4px solid #ffd600;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9aa7be;">
                      <strong style="color: #ffffff;">Didn't request this?</strong><br>
                      If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 24px 28px 24px; background-color: #0b0e16; border-top: 1px solid #1a2030;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #8f9bb3;">
                FordaGO Gym & Fitness
              </p>
              <p style="margin: 0; font-size: 11px; color: #5a6479; line-height: 1.4;">
                This is an automated security email. Please do not reply to this address.<br>
                © {{ date('Y') }} FordaGO • All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
