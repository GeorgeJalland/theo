from datetime import datetime, timezone
import json
import logging
from sqlmodel import Session

from data_sourcing.db.database import iter_quote_batches

logging.basicConfig(level=logging.INFO)

PROMPT_TEMPLATE = """
You are classifying comedy quotes from Theo Von for a quote database.

TASK:
Determine whether each quote is fit for purpose as a standalone quote. If not fit for purpose, provide a rejection reason.

LABEL DEFINITIONS:
- true = The quote is funny, interesting, absurd, or impactful without needing additional context.
- false = The quote depends on surrounding conversation/setup/context to be funny or meaningful.

GUIDELINES:
Mark FALSE if:
- The quote sounds incomplete or truncated
- The quote is ordinary conversation
- The humor depends heavily on knowing prior context
- The quote lacks standalone absurdity/imagery/impact

EXAMPLES:

FALSE:
"But then it starts eating like, you know, starts just munching all your leafy greens and you're like, not about to grow food for a rat."
Reason: Borderline but ultimately lacks context.

TRUE:
"He definitely seemed like he could just fix a flat tire with his tongue."
Reason: Funny, absurd and unique.

FALSE:
"I'm trying to grow up in church"
Reason: Without context sounds like fairly ordinary statement.

TRUE:
"But how could you pay attention if your eyes weren't even teammate like buddies or whatever?"
Reason: There is an assumption here that he's talking about someone with a lazy eye, so even without explicit context this is very funny.

TRUE:
"On just a damn Mallard of a woman, you know?"
Reason: Funny and unique.

TRUE:
"Oh, he'll just RIP an omelette. Out of a chicken's ass."
Reason: Absurd and funny.

TRUE:
"It's just nice when people laugh. I feel OK, yeah."
Reason: This a quite a human and tender quote, although not funny it's still impactful.

TRUE:
"She looks like a nice beautiful duck blind I feel like."
Reason: May lack some context but still works as absurd unique quote.

FALSE:
"Now you got them trusty steeds in your face, huh?"
Reason: Lacks context.

INPUT:
Quotes will be provided in the following format:
[
  {{
    "id": int,
    "quote": str
  }}
]

OUTPUT REQUIREMENTS:
Return ONLY valid JSON.
Do not include explanations.
Please take the id from the input quote's id.

FORMAT:
[
  {{
    "id": int,
    "quote": "...",
    "fit_for_purpose": true,
    "rejection_reason": "optional"
  }}
]

QUOTES TO CLASSIFY: 
{quotes_json}
"""

MODEL = "llama-3.3-70b-versatile"
BATCH_SIZE = 50

def classify_pending_quotes(session: Session, client):
    for batch in iter_quote_batches(session, batch_size=BATCH_SIZE):
        quote_lookup = {quote.id: quote for quote in batch}

        quotes_json = [{"id": quote.id, "quote": quote.text} for quote in batch]
        prompt = PROMPT_TEMPLATE.format(quotes_json=json.dumps(quotes_json))

        response = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict classifier. Return JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        result_text = response.choices[0].message.content
        results = json.loads(result_text)

        for result in results:
            quote = quote_lookup[result["id"]]
            quote.status = "APPROVED" if result["fit_for_purpose"] else "REJECTED"
            quote.rejection_reason = result.get("rejection_reason")
            quote.status_updated_at = datetime.now(timezone.utc)

        session.commit()
