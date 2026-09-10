/** Explicit display and panel settings after project configuration shorthand is resolved. */
export interface RuntimeStatsConfig {
  /** Expanded shows all panels; compact presents one panel at a time. */
  readonly display: 'expanded' | 'compact';
  readonly fps: boolean;
  readonly frameInterval: boolean;
  /** Approximate browser-reported JavaScript heap, when supported. */
  readonly jsHeap: boolean;
  /** Submitted WebGL draw operations per frame; instances are not separate draws. */
  readonly drawCalls: boolean;
  /** WebGL bindTexture calls per frame, including repeated and null bindings. */
  readonly textureBinds: boolean;
  /** WebGL useProgram calls per frame, including repeated and null uses. */
  readonly programUses: boolean;
}

/** Settings consumed by optional development tools, not by runtime scheduling. */
export interface RuntimeDevtoolsConfig {
  /** Development-only Escape shortcut and DOM Skip button. */
  readonly endCardTrigger: boolean;
  /** Development-only audio toggle, shown only when audio is enabled. */
  readonly soundControl: boolean;
  readonly stats: false | RuntimeStatsConfig;
}
