

# Fix: PricingModal Reopens After Closing

## Problem
When you click the X button to close the "Get Your Letter" pricing modal, it immediately reopens. This happens because the `GeneratingOverlay` component retains its "completed" state (`timerComplete` and `generationComplete` both `true`) even after the pricing modal is closed. The effect that calls `onComplete` (which sets `showPricing(true)`) can re-fire whenever the `onComplete` function reference changes on re-render, causing the modal to reopen.

## Solution

### File: `src/components/letter/GeneratingOverlay.tsx`

Add a `hasCompleted` ref to ensure `onComplete` is only called **once** per generation cycle:

- Add a `useRef` (`hasCompleted`) that tracks whether `onComplete` has already been invoked
- In the completion effect, check `hasCompleted.current` before calling `onComplete()`
- Reset `hasCompleted` to `false` when `isOpen` becomes true (new generation starts)

### File: `src/components/letter/LetterGenerator.tsx`

Stabilize the `onComplete` callback with `useCallback` so it doesn't create a new reference on every render, which would retrigger the effect.

## Technical Details

**GeneratingOverlay.tsx changes:**
- Add `const hasCompleted = useRef(false)` 
- In the `isOpen` reset effect, add `hasCompleted.current = false`
- In the completion effect (line 107-115), wrap with `if (!hasCompleted.current)` and set it to `true` before calling `onComplete()`

**LetterGenerator.tsx changes:**
- Wrap the `onComplete` handler in `useCallback` to stabilize the reference

This ensures the pricing modal opens exactly once after generation, and stays closed when the user dismisses it.

