# Two-card behavior

The application renders two cards. Each becomes interactive after its entrance, reveals once,
and contributes once to completion. After both reveal animations finish, the scene presents its
endcard. Runtime duration or inactivity can also complete the playable.

Gameplay interaction suspends the hint. Releasing or cancelling the final held pointer restarts
its inactivity delay. Native cancellation listeners cover events Pixi does not forward. Resize
refits the scene while preserving card state. Completion stops gameplay and hint work.

The tutorial ends on the first accepted gameplay tap or its timeout. Sound and store controls do
not count as card taps. CTA actions route through `playable.openStore()`. Secondary sounds are
loaded after readiness; looping audio may wait for availability while premature one-shots are dropped.

Before campaign delivery, manually check early/repeated taps, multiple pointers, cancellation,
rotation during animations, both completion timers, hidden/resume behavior, audio unlock and CTA
routing. Repeat on the intended devices and network hosts. The focused hint tests do not replace
those checks. Use the configuration files for current timer values and feature options.
