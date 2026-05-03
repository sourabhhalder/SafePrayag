"""
Drop-in replacement for the send_sms function in main.py.
Sends via Fast2SMS AND Telegram simultaneously.
Both run as background tasks so SOS response is instant.
"""

import httpx
import os

# ── Fast2SMS ──────────────────────────────────────────────────────────────────

async def send_fast2sms(phone: str, message: str):
    """Send SMS via Fast2SMS. Phone must be 10-digit Indian mobile."""
    key = os.getenv("FAST2SMS_API_KEY", "").strip()

    # Clean to 10 digits
    clean = phone.strip().replace("+91","").replace(" ","").replace("-","")
    if clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]

    print(f"\n[Fast2SMS] To: {clean}")
    print(f"[Fast2SMS] Message: {message}")
    print(f"[Fast2SMS] Key: {'YES (' + key[:8] + '...)' if key else 'NOT SET'}")

    if not key:
        print("[Fast2SMS] No API key — skipping")
        return

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": key, "Content-Type": "application/json"},
                json={
                    "route": "q",
                    "message": message,
                    "language": "english",
                    "flash": 0,
                    "numbers": clean,
                },
            )
            result = r.json()
            print(f"[Fast2SMS] Response: {result}")
            if result.get("return"):
                print(f"[Fast2SMS] ✅ SMS sent to {clean}")
            else:
                print(f"[Fast2SMS] ❌ Failed: {result.get('message','')} | errors: {result.get('errors_keys','')}")
    except Exception as e:
        print(f"[Fast2SMS] ❌ Exception: {e}")


# ── Telegram ──────────────────────────────────────────────────────────────────

async def send_telegram(message: str):
    """
    Send Telegram message to a chat/group.
    Set in .env:
        TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjklMNOpqrSTUvwxYZ
        TELEGRAM_CHAT_ID=your_chat_id (can be personal, group, or channel)

    How to get your chat ID:
        1. Create a bot at https://t.me/BotFather → /newbot → copy token
        2. Open Telegram → search your bot → send /start
        3. Open: https://api.telegram.org/bot<TOKEN>/getUpdates
        4. Copy the "chat":{"id": XXXXXXXX} number — that is your CHAT_ID
    """
    token   = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID",   "").strip()

    print(f"\n[Telegram] Token set: {'YES' if token else 'NOT SET'}")
    print(f"[Telegram] Chat ID: {chat_id or 'NOT SET'}")
    print(f"[Telegram] Message: {message}")

    if not token or not chat_id:
        print("[Telegram] Missing token or chat_id — skipping")
        return

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                },
            )
            result = r.json()
            print(f"[Telegram] Response: {result}")
            if result.get("ok"):
                print(f"[Telegram] ✅ Message sent")
            else:
                print(f"[Telegram] ❌ Failed: {result.get('description','Unknown error')}")
    except Exception as e:
        print(f"[Telegram] ❌ Exception: {e}")


# ── Combined SOS alert ────────────────────────────────────────────────────────

async def send_sos_alerts(
    guardian_phone: str,
    user_name: str,
    lat: float,
    lon: float,
    police_name: str,
    police_phone: str,
):
    """
    Send SOS via BOTH Fast2SMS and Telegram simultaneously.
    Called as a background task from sos_trigger endpoint.
    """
    # Plain text for Fast2SMS (no URLs, no trigger words)
    sms_message = (
        f"SafePrayag: {user_name} needs immediate help. "
        f"Location: {round(lat,4)},{round(lon,4)}. "
        f"Contact {police_name} on {police_phone}. "
        f"Please respond now."
    )

    # Rich message for Telegram (supports HTML, URLs allowed)
    telegram_message = (
        f"🆘 <b>SOS ALERT</b>\n\n"
        f"👤 <b>User:</b> {user_name}\n"
        f"📍 <b>Location:</b> <a href='https://www.google.com/maps?q={lat},{lon}'>"
        f"{round(lat,4)}, {round(lon,4)}</a>\n"
        f"🚔 <b>Nearest Police:</b> {police_name}\n"
        f"📞 <b>Police Phone:</b> {police_phone}\n\n"
        f"⚠️ Please respond immediately!"
    )

    # Send both — independently, so one failure doesn't stop the other
    import asyncio
    await asyncio.gather(
        send_fast2sms(guardian_phone, sms_message),
        send_telegram(telegram_message),
        return_exceptions=True,  # don't crash if one fails
    )
