## 2024-05-24 - Bulk Processing Network Bottlenecks
**Learning:** Sequential processing in bulk uploads (e.g., awaiting inside a `for...of` loop) creates severe O(n) network bottlenecks, while unbounded `Promise.all` creates memory exhaustion and rate-limiting risks for large datasets.
**Action:** Always implement chunked concurrency (e.g., slicing into batches of 10-50 and using `Promise.all` on each chunk sequentially) for bulk operations involving external API calls or database inserts to balance speed and stability.
