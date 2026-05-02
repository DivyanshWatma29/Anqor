## 2024-05-01 - [ClaimForm UX/a11y improvements]
**Learning:** Proper form association (using `htmlFor` and `id`) is crucial for screen readers, and adding visual feedback (like a spinning loader on buttons) significantly improves the perceived performance and clarity of async operations.
**Action:** Always ensure form inputs have proper `htmlFor` and `id` bindings and always provide explicit loading states (like `Loader2` from lucide-react) for form submissions or API calls.
