## 2024-05-01 - [ClaimForm UX/a11y improvements]
**Learning:** Proper form association (using `htmlFor` and `id`) is crucial for screen readers, and adding visual feedback (like a spinning loader on buttons) significantly improves the perceived performance and clarity of async operations.
**Action:** Always ensure form inputs have proper `htmlFor` and `id` bindings and always provide explicit loading states (like `Loader2` from lucide-react) for form submissions or API calls.
## 2026-05-02 - [Keyboard focus styles for hover-reveal elements]
**Learning:** When hiding elements visually until hovered (e.g. `opacity-0 group-hover:opacity-100`), they become invisible accessibility traps for keyboard users unless explicitly styled for focus.
**Action:** Always pair hover-reveal utility classes with their focus-visible equivalents (e.g. `focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm`) to ensure keyboard navigability.
