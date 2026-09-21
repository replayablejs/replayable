---
'@replayablejs/runtime': patch
---

Make update-channel unsubscription take effect during the current dispatch. A callback removed before its turn is now skipped, allowing views to unsubscribe before destroying their artwork without receiving a pending update. Executing callbacks finish normally; newly added or re-added listeners wait until the next dispatch. This applies to variable updates, fixed updates, and post-render callbacks.
