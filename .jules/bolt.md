## 2026-05-02 - Array Allocation Optimizations
**Learning:** Multiple array methods chained together (like `.slice().reverse().map()` or `.filter().length`) cause hidden intermediate allocations which can be easily eliminated by replacing them with a single loop or `reduce`.
**Action:** Look for sequential array operations and consolidate them into a single pass when optimizing data transformations.
