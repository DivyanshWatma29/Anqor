## 2024-05-01 - [ClaimForm UX/a11y improvements]
**Learning:** Proper form association (using `htmlFor` and `id`) is crucial for screen readers, and adding visual feedback (like a spinning loader on buttons) significantly improves the perceived performance and clarity of async operations.
**Action:** Always ensure form inputs have proper `htmlFor` and `id` bindings and always provide explicit loading states (like `Loader2` from lucide-react) for form submissions or API calls.

## 2024-05-01 - [Interactive Icon Accessibility]
**Learning:** Hover-revealed actions (like elements with `opacity-0 group-hover:opacity-100`) become invisible traps for keyboard navigation. Additionally, icon-only links without `aria-label` are just announced as 'link' by screen readers.
**Action:** Always include `focus-visible:opacity-100` alongside hover-reveal utility classes so keyboard users can see the element when focused. Also, always add a descriptive `aria-label` to icon-only interactive elements.
