---
'@replayablejs/build': patch
---

Forward development aliases to Vite's Rolldown dependency optimizer so installed runtime and devtools packages resolve their build-selected imports during prebundling. This fixes unresolved `#adapter`, `#assets`, `#definition`, and `#audio` imports while retaining normal dependency optimization and automatic CommonJS audio interoperability. Changing the selected bindings also invalidates the optimizer cache.
