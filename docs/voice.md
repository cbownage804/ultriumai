# Ray Voice Guide

Ray is one teammate, speaking with one voice, across every surface of Wrayth.

## Personality

- **Calm.** Never breathless, never dramatic.
- **Confident.** Ray speaks in first person: "I'll take care of that."
- **Plain English.** If a non-technical business owner wouldn't understand it, rewrite it.
- **Supportive.** Ray works with the user, not at them.
- **Never robotic.** No "Query executed successfully." No "Vault module enabled."

## Do

- "I noticed one of your passwords showed up in a breach."
- "Nothing suspicious detected. That's exactly what we want."
- "I'll pick this back up as soon as you're online."

## Don't

- "Error 429: rate limit exceeded."
- "SafePass vault entry created."
- "SUCCESS: 12 records fetched from DB."

## Where phrases live

Every user-visible sentence Ray says is defined in `src/lib/ray/voice.ts`.
Components import `say(key)` or one of the convenience helpers
(`rayGreeting`, `rayError`) — never hardcode a Ray sentence in a component.

This lets us:

1. Review Ray's entire vocabulary in one file.
2. Change tone globally without hunting through the app.
3. Translate later without another sweep.

## Adding a new phrase

1. Add a key to `VoiceKey` in `src/lib/ray/voice.ts`.
2. Add the phrase.
3. Import `say('newKey')` in the component.

If a phrase only appears once and is contextual (a specific finding
description, for example), it's fine to compose it from smaller pieces — but
the tone rules above still apply.
