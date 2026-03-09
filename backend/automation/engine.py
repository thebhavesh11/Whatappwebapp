"""Automation engine — orchestrates message processing pipeline."""

import os
import logging
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Lead, Conversation, Message, AISetting, Business

logger = logging.getLogger(__name__)

BRIDGE_URL = os.getenv("WHATSAPP_BRIDGE_URL", "http://localhost:3001")


async def process_incoming_message(
    phone: str, message: str, name: str, business_id: int, db: AsyncSession
) -> dict:
    """Process an incoming WhatsApp message end-to-end."""

    # 1. Find or create lead
    result = await db.execute(select(Lead).where(Lead.phone_number == phone))
    lead = result.scalar_one_or_none()
    if not lead:
        lead = Lead(phone_number=phone, name=name or "Unknown", business_id=business_id)
        db.add(lead)
        await db.flush()
        await db.refresh(lead)
        logger.info(f"[Engine] Created new lead: {lead.name} ({lead.phone_number})")

    # 2. Find or create conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.lead_id == lead.id,
            Conversation.business_id == business_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(lead_id=lead.id, business_id=business_id)
        db.add(conv)
        await db.flush()
        await db.refresh(conv)

    # 3. Save incoming message
    customer_msg = Message(
        conversation_id=conv.id,
        sender_type="customer",
        message_text=message,
    )
    db.add(customer_msg)
    await db.flush()

    # 4. Get AI settings and business info
    result = await db.execute(select(AISetting).where(AISetting.business_id == business_id))
    ai_settings = result.scalar_one_or_none()

    result = await db.execute(select(Business).where(Business.id == business_id))
    business = result.scalar_one_or_none()

    # 5. Build conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    history = list(reversed(result.scalars().all()))

    # 6. Generate AI reply
    ai_reply = await generate_ai_reply(ai_settings, business, history, message)

    # 7. Save AI reply
    ai_msg = Message(
        conversation_id=conv.id,
        sender_type="ai",
        message_text=ai_reply,
    )
    db.add(ai_msg)
    await db.flush()

    # 8. Send reply via WhatsApp
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{BRIDGE_URL}/send",
                json={"phone": phone, "message": ai_reply},
            )
        logger.info(f"[Engine] Replied to {phone}: {ai_reply[:50]}...")
    except Exception as e:
        logger.error(f"[Engine] Failed to send reply: {e}")

    # 9. Score lead
    await score_lead(lead, ai_settings, history, db)

    return {"reply": ai_reply, "lead_id": lead.id}


async def generate_ai_reply(ai_settings, business, history, current_message) -> str:
    """Generate an AI reply using the configured provider."""
    if not ai_settings or not ai_settings.api_key:
        return "Thank you for your message! We'll get back to you shortly."

    # Build system prompt
    system_prompt = ai_settings.system_prompt or "You are a helpful business assistant. Be professional and concise."

    # Append business info as reference
    if business:
        business_info = f"\n\n--- Business Reference Data ---\nBusiness: {business.name}\nIndustry: {business.industry}\nServices: {business.services}\nPricing: {business.pricing}\nLocation: {business.location}\nWorking Hours: {business.working_hours}\nOffers: {business.offers}\nFAQs: {business.faqs}"
        system_prompt += business_info

    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        role = "assistant" if msg.sender_type == "ai" else "user"
        messages.append({"role": role, "content": msg.message_text})

    try:
        provider = ai_settings.provider.lower()

        if provider in ("openai", "openrouter"):
            from openai import AsyncOpenAI
            base_url = "https://openrouter.ai/api/v1" if provider == "openrouter" else None
            client = AsyncOpenAI(api_key=ai_settings.api_key, base_url=base_url)
            response = await client.chat.completions.create(
                model=ai_settings.model,
                messages=messages,
                temperature=ai_settings.temperature,
                max_tokens=ai_settings.max_tokens,
            )
            return response.choices[0].message.content.strip()

        elif provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=ai_settings.api_key)
            model = genai.GenerativeModel(
                ai_settings.model,
                system_instruction=system_prompt,
            )
            chat_history = []
            for msg in history:
                role = "model" if msg.sender_type == "ai" else "user"
                chat_history.append({"role": role, "parts": [msg.message_text]})
            chat = model.start_chat(history=chat_history)
            response = chat.send_message(current_message)
            return response.text.strip()

        else:
            return "Thank you for your message! We'll get back to you shortly."

    except Exception as e:
        logger.error(f"[Engine] AI error: {e}")
        return "Thank you for reaching out! Our team will respond shortly."


async def score_lead(lead, ai_settings, history, db):
    """Score a lead based on conversation history."""
    if not ai_settings or not ai_settings.api_key:
        return

    conversation_text = "\n".join(
        [f"{'Customer' if m.sender_type == 'customer' else 'AI'}: {m.message_text}" for m in history]
    )

    # Use the custom scoring prompt from settings, or fall back to default
    custom_scoring = ai_settings.scoring_prompt.strip() if ai_settings.scoring_prompt else ""

    if custom_scoring:
        scoring_prompt = f"""{custom_scoring}

Return ONLY a JSON object: {{"score": number, "label": "hot|warm|cold"}}

Conversation:
{conversation_text}"""
    else:
        scoring_prompt = f"""Analyze this conversation and score the lead from 0-100.
Return ONLY a JSON object: {{"score": number, "label": "hot|warm|cold"}}
- HOT (80-100): Ready to buy/visit, has budget clarity, urgency
- WARM (50-79): Interested but needs nurturing, comparing options
- COLD (0-49): Just browsing, no budget mentioned, vague interest

Conversation:
{conversation_text}"""

    try:
        provider = ai_settings.provider.lower()
        if provider in ("openai", "openrouter"):
            from openai import AsyncOpenAI
            base_url = "https://openrouter.ai/api/v1" if provider == "openrouter" else None
            client = AsyncOpenAI(api_key=ai_settings.api_key, base_url=base_url)
            response = await client.chat.completions.create(
                model=ai_settings.model,
                messages=[{"role": "user", "content": scoring_prompt}],
                temperature=0.3,
                max_tokens=100,
            )
            import json
            text = response.choices[0].message.content.strip()
            # Try to parse JSON
            if "{" in text:
                data = json.loads(text[text.index("{"):text.rindex("}") + 1])
                lead.lead_score = data.get("score", lead.lead_score)
                lead.lead_status = data.get("label", lead.lead_status)
                await db.flush()
    except Exception as e:
        logger.error(f"[Engine] Scoring error: {e}")
