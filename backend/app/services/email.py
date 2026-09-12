import json
import logging
import smtplib
import socket
import urllib.request
import urllib.error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger("bikecare.email")


def _send_via_resend(to_email: str, subject: str, html_content: str, text_content: str, sender_name: str) -> bool:
    """Send email via Resend HTTP API (Port 443 - never blocked on cloud hosts)."""
    try:
        from_email = settings.EMAILS_FROM_EMAIL or "onboarding@resend.dev"
        from_header = f"{sender_name} <{from_email}>" if "@" in from_email else from_email
        payload = json.dumps({
            "from": from_header,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY.strip()}",
                "Content-Type": "application/json",
                "User-Agent": "VehicleNest/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if 200 <= resp.status < 300:
                logger.info(f"Successfully sent OTP email to {to_email} via Resend API")
                return True
    except Exception as e:
        logger.error(f"Resend API email error: {e}", exc_info=True)
    return False


def _send_via_brevo(to_email: str, subject: str, html_content: str, text_content: str, sender_name: str) -> bool:
    """Send email via Brevo REST API (Port 443 - never blocked on cloud hosts)."""
    try:
        from_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER or "dilipsaimarella@gmail.com"
        payload = json.dumps({
            "sender": {"name": sender_name, "email": from_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "api-key": settings.BREVO_API_KEY.strip(),
                "Content-Type": "application/json",
                "User-Agent": "VehicleNest/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if 200 <= resp.status < 300:
                logger.info(f"Successfully sent OTP email to {to_email} via Brevo API")
                return True
    except Exception as e:
        logger.error(f"Brevo API email error: {e}", exc_info=True)
    return False


def _send_via_smtp(to_email: str, subject: str, html_content: str, text_content: str, sender_name: str) -> bool:
    """Send email via SMTP with IPv4 forced socket connection."""
    sender_email = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Resolve host explicitly to IPv4 to prevent Linux [Errno 101] Network is unreachable on IPv6
        host = settings.SMTP_HOST
        try:
            addr_info = socket.getaddrinfo(host, settings.SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
            if addr_info:
                host = addr_info[0][4][0]
        except Exception:
            pass

        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(host, settings.SMTP_PORT, timeout=8)
        else:
            server = smtplib.SMTP(host, settings.SMTP_PORT, timeout=8)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent OTP email to {to_email} via SMTP")
        return True
    except Exception as exc:
        logger.error(f"Failed to send OTP email to {to_email} via SMTP: {exc}")
        return False


def send_otp_email(to_email: str, otp_code: str, full_name: str = "") -> bool:
    """
    Dispatches a 6-digit OTP verification email via Resend API, Brevo API, or SMTP.
    """
    subject = f"{otp_code} is your Vehicle'Nest verification code"
    sender_name = settings.EMAILS_FROM_NAME or "Vehicle'Nest"

    name_str = f" {full_name}" if full_name else ""
    text_content = f"""Hello{name_str},

Your verification code for Vehicle'Nest is: {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone.

Care That Keeps You Moving
Vehicle'Nest Team • By Marella Dilip
"""

    greeting_html = f"Hi <strong>{full_name}</strong>," if full_name else "Hi there,"
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

    # 1. Try Resend HTTP API (Recommended on Render)
    if settings.RESEND_API_KEY:
        return _send_via_resend(to_email, subject, html_content, text_content, sender_name)

    # 2. Try Brevo HTTP API
    if settings.BREVO_API_KEY:
        return _send_via_brevo(to_email, subject, html_content, text_content, sender_name)

    # 3. Try SMTP with IPv4 forced resolution
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        return _send_via_smtp(to_email, subject, html_content, text_content, sender_name)

    logger.warning(
        f"[EMAIL PROVIDER NOT CONFIGURED] No RESEND_API_KEY, BREVO_API_KEY, or SMTP credentials. "
        f"OTP for {to_email} is: [{otp_code}]."
    )
    return False
