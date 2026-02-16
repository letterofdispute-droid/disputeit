

# Add Voice Input to Dispute Assistant

## Overview

Add a microphone button that lets users speak their dispute instead of typing. The voice input will be communicated as a feature in both the hero search bar and the chat input area.

## Approach: Browser Speech Recognition (Web Speech API)

Using the built-in browser Web Speech API - no external API keys, no extra cost, works on Chrome, Edge, Safari, and most mobile browsers. This is the fastest path to a working voice feature and covers the vast majority of users.

## Changes

### 1. New Hook: `src/hooks/useSpeechRecognition.ts`
A reusable hook wrapping the Web Speech API:
- Manages `isListening`, `transcript`, and `isSupported` state
- Handles `start()`, `stop()`, and auto-stop on silence
- Returns interim results so users see words appearing in real-time
- Gracefully falls back (hides mic button) on unsupported browsers

### 2. Update `src/components/dispute-assistant/ChatInput.tsx`
- Add a microphone toggle button next to the send button
- When listening: mic button pulses with an animation, textarea shows live transcript
- When user stops speaking (or taps mic again): transcript populates the textarea for review before sending
- Option: auto-send after a brief pause for a more conversational feel

### 3. Update Hero Search Bar in `src/components/home/Hero.tsx`
- Add a small microphone icon inside the search prompt bar (before the "AI Help" badge)
- Update placeholder text to: "Type or speak your dispute..."
- Clicking the mic icon opens the Dispute Assistant modal and auto-starts listening

### 4. Update `src/index.css`
- Add a `animate-pulse-ring` keyframe for the listening indicator (a subtle pulsing ring around the mic button)

## Visual Design

The chat input area will change from:

```text
[Describe what happened...              ] [Send]
```

To:

```text
[Type or speak your dispute...           ] [Mic] [Send]
```

When listening, the mic button gets a pulsing ring animation and the textarea shows the live transcript as the user speaks.

## Technical Notes

- Web Speech API is available on ~93% of browsers globally
- On unsupported browsers, the mic button simply won't render (graceful degradation)
- No new dependencies needed
- No database changes
- No new edge functions
- The speech recognition runs entirely client-side
- TypeScript declarations for `webkitSpeechRecognition` will be added to the hook file

