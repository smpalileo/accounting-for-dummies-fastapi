"""Utility helpers for sending transactional emails via Resend."""
import logging
from typing import Iterable

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY is not configured; email will not be sent.")
        return False
    if not settings.RESEND_FROM_EMAIL:
        logger.warning("RESEND_FROM_EMAIL is not configured; email will not be sent.")
        return False
    return True


def send_email(*, to: Iterable[str], subject: str, html_body: str) -> bool:
    """Send an email using the Resend API. Returns True on success."""
    if not _is_configured():
        return False

    try:
        resend.api_key = settings.RESEND_API_KEY  # Set per call to avoid global side-effects.
        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_EMAIL,
                "to": list(to),
                "subject": subject,
                "html": html_body,
            }
        )
        return True
    except Exception:  # pragma: no cover - log unexpected errors
        logger.exception("Failed to send email via Resend.")
        return False


def build_verification_email(*, recipient: str, verification_url: str) -> dict:
    subject = "Verify your email address"
    html = f"""
        <h1>Verify your email</h1>
        <p>Thanks for signing up! Please verify your email address by clicking the link below.</p>
        <p><a href="{verification_url}">Verify Email</a></p>
        <p>If you did not create an account, you can safely ignore this message.</p>
    """
    return {"to": [recipient], "subject": subject, "html": html}


def build_password_reset_email(*, recipient: str, reset_url: str) -> dict:
    subject = "Reset your password"
    html = f"""
        <h1>Password reset requested</h1>
        <p>We received a request to reset your password. Click the link below to set a new password.</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this message.</p>
    """
    return {"to": [recipient], "subject": subject, "html": html}

