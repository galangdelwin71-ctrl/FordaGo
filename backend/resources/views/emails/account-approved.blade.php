<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FordaGO Account Approved</title>
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
              <div align="center" style="margin-bottom: 18px;">
                <span style="display: inline-block; background-color: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.4); border-radius: 30px; padding: 6px 16px; font-size: 12px; font-weight: 800; color: #4ade80; text-transform: uppercase; letter-spacing: 1px;">
                  ✓ Approved & Ready
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">
                Your Account Has Been Approved! 🎉
              </h2>
              
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #a4b0c6; text-align: center;">
                Hi <strong style="color: #ffffff;">{{ $name ?? 'Member' }}</strong>,<br>
                Great news! Your FordaGO account has been reviewed and approved by our administration team. You are now officially verified and can sign in to the app!
              </p>

              <!-- Account Details Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0; background-color: #171c2a; border: 1.5px solid #232a3d; border-radius: 16px;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8f9bb3;">Account Username:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">@{{ $username ?? 'member' }}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8f9bb3;">Membership Plan:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 800; color: #ffd600;">{{ $typeLabel ?? 'Active Pass' }}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8f9bb3;">Status:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 800; color: #4ade80;">ACTIVE</td>
                      </tr>
                      @if(!empty($expiry))
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #8f9bb3;">Valid Until:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">{{ $expiry }}</td>
                      </tr>
                      @endif
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Callout Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px; background-color: #161a26; border-radius: 14px; border-left: 4px solid #ffd600;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #ffffff;">
                      🚀 Next Step: Open the app & log in
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9aa7be;">
                      Open your <strong>FordaGO</strong> app or visit <a href="https://fordago.online" style="color: #ffd600; text-decoration: none; font-weight: 700;">fordago.online</a> and sign in with your email/username and password.
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
                This is an automated confirmation message. Please do not reply directly to this email.<br>
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
