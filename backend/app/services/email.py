import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger("bikecare.email")


def send_otp_email(to_email: str, otp_code: str, full_name: str = "") -> bool:
    """
    Sends a 6-digit OTP verification email via SMTP (e.g. Gmail).
    If SMTP credentials are not configured, logs the OTP for development.
    """
    subject = f"{otp_code} is your Vehicle'Nest verification code"
    sender_name = settings.EMAILS_FROM_NAME or "Vehicle'Nest"
    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER

    # Plain text version
    name_str = f" {full_name}" if full_name else ""
    text_content = f"""Hello{name_str},

Your verification code for Vehicle'Nest is: {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone.

Care That Keeps You Moving
Vehicle'Nest Team • By Marella Dilip
"""

    # Greeting for HTML
    greeting_html = f"Hi <strong>{full_name}</strong>," if full_name else "Hi there,"

    # Rich HTML version
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vehicle'Nest Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.05)); border-bottom: 1px solid #334155;">
              <div style="font-size: 40px; margin-bottom: 12px;">🚗🏍️⚡</div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Vehicle'Nest</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px;">Care That Keeps You Moving</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                {greeting_html}<br>
                Thank you for joining Vehicle'Nest. Please enter the following 6-digit verification code to complete your registration and activate your garage.
              </p>
              
              <!-- OTP Box -->
              <div style="text-align: center; margin: 28px 0; padding: 20px; background: #0f172a; border: 2px dashed #38bdf8; border-radius: 12px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">{otp_code}</span>
                <div style="margin-top: 8px; font-size: 12px; color: #64748b;">Valid for {settings.OTP_EXPIRE_MINUTES} minutes</div>
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not request this verification code, please ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; background-color: #0f172a; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                Vehicle'Nest Garage Management Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Crafted with ❤️ By <span style="color: #38bdf8; font-weight: 600;">Marella Dilip</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    # Check if SMTP configuration is provided
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"[OTP EMAIL NOT CONFIGURED] No SMTP credentials provided in environment. "
            f"Generated OTP for {to_email} is: [{otp_code}]. "
            f"Set SMTP_USER and SMTP_PASSWORD in .env or Render environment variables to send real emails."
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        # Connect to SMTP server
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent OTP email to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send OTP email to {to_email}: {exc}", exc_info=True)
        return False
