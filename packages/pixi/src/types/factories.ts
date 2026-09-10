import type {
  ColorSource,
  Container,
  ObservablePoint,
  EventMode,
  PointData,
  TextString,
  TextStyle,
  TextStyleOptions,
  Texture,
  SplitTextOptions,
} from 'pixi.js';

/** Internal structural contract shared by sprites and text with an anchor. */
export type AnchorableDisplayObject = Container & {
  readonly anchor: ObservablePoint;
};

/** Properties shared by Replayable's Pixi display-object factories. */
export interface DisplayObjectOptions {
  readonly alpha?: number;
  readonly pivot?: PointData;
  readonly position?: PointData;
  readonly rotation?: number;
  readonly scale?: PointData;
  readonly visible?: boolean;
  readonly zIndex?: number;
}

/** Shared properties for display objects whose visual origin can be anchored. */
export interface AnchorableDisplayObjectOptions extends DisplayObjectOptions {
  readonly anchor?: PointData;
}

/** Appearance and interaction properties shared by sprite-based factories. */
export interface SpriteDisplayOptions extends AnchorableDisplayObjectOptions {
  readonly eventMode?: EventMode;
  readonly tint?: ColorSource;
}

/** Options for creating a Pixi sprite from a loaded alias or existing texture. */
export interface CreateSpriteOptions extends SpriteDisplayOptions {
  readonly texture?: string | Texture;
}

/** Options for creating a resizable Pixi nine-slice sprite. */
export interface CreateNineSliceSpriteOptions extends AnchorableDisplayObjectOptions {
  readonly bottomHeight: number;
  readonly height: number;
  readonly leftWidth: number;
  readonly rightWidth: number;
  readonly texture: string | Texture;
  readonly topHeight: number;
  readonly width: number;
}

/** Options for creating a Pixi animated sprite from loaded texture frames. */
export interface CreateAnimatedSpriteOptions extends AnchorableDisplayObjectOptions {
  readonly animationSpeed?: number;
  readonly autoPlay?: boolean;
  readonly frames: readonly (string | Texture)[];
  readonly loop?: boolean;
}

/** Options for creating Pixi canvas text without implicit fitting or localization. */
export interface CreateTextOptions extends AnchorableDisplayObjectOptions {
  readonly style: TextStyle | Partial<TextStyleOptions>;
  readonly text: TextString;
}

/** Native split-text options with Replayable's shared transform defaults; no fitting or animation. */
export interface CreateSplitTextOptions
  extends Omit<SplitTextOptions, keyof DisplayObjectOptions>, DisplayObjectOptions {}
