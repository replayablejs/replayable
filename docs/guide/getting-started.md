# Getting Started

Create a small playable, preview it in your browser, and export it as a single HTML file.
No renderer or source artwork is required for this first example.

## Installation

### Prerequisites

- Node.js 24 or newer.
- A terminal and a text editor with TypeScript support.
- npm or pnpm. The repository examples use pnpm 10.32.1.

Create a project directory and initialize its manifest:

```sh
mkdir hello-playable
cd hello-playable
npm init -y
npm pkg set type=module
```

Install the runtime and development tools:

::: code-group

```sh [npm]
npm install @replayablejs/runtime@0.1.0-alpha.0
npm install -D @replayablejs/cli@0.1.0-alpha.0 @replayablejs/config@0.1.0-alpha.0 typescript
```

```sh [pnpm]
pnpm add @replayablejs/runtime@0.1.0-alpha.0
pnpm add -D @replayablejs/cli@0.1.0-alpha.0 @replayablejs/config@0.1.0-alpha.0 typescript
```

:::

::: info Alpha versions
Keep Replayable packages on the same version. These instructions pin `0.1.0-alpha.0`; the `alpha`
npm tag selects the current alpha. APIs can change before 1.0.
:::

## Project Structure

Create the following files and an empty `assets` directory:

```text
hello-playable/
├─ assets/
├─ src/
│  └─ main.ts
├─ package.json
└─ replayable.config.ts
```

Replayable generates the browser HTML and asset modules. You do not need to create `index.html`
or a Vite configuration.

### Configuration

Create `replayable.config.ts`:

```ts
import { defineConfig } from '@replayablejs/config';

export default defineConfig({
  name: 'hello-playable',
  assets: {
    sourceDir: 'assets',
    outDir: 'src/assets/resources',
    assets: {},
    emit: { assets: 'src/assets/assets.ts' },
  },
  localization: { languages: ['en'], fallback: 'en' },
  screen: {
    orientations: {
      portrait: {
        enabled: true,
        width: 390,
        height: 844,
        ratio: { min: 0.4, max: 1 },
      },
      landscape: {
        enabled: true,
        width: 844,
        height: 390,
        ratio: { min: 1, max: 2.5 },
      },
    },
    resolution: {
      pixelRatio: { min: 1, max: 2 },
      renderScale: { minimal: 0.5, reduced: 0.65, balanced: 0.85, full: 1 },
    },
  },
  store: {
    androidUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
    iosUrl: 'https://apps.apple.com/app/id123456789',
  },
});
```

The configuration names the project, defines the screen's design sizes and provides the source
and output paths for assets. `assets: {}` selects no resources, which is enough for this DOM
example. Omitted network/version settings default to `preview` and `default`.

::: tip Store destinations
The URLs above are placeholders. Replace them with your application's destinations before using
store buttons or delivering an ad. This example does not navigate to the store.
:::

### Your First Playable

Create `src/main.ts`:

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();

const button = document.createElement('button');
button.textContent = 'Tap to play';
button.style.cssText = 'padding: 24px; font: 24px sans-serif; cursor: pointer';
playable.container.style.cssText =
  'display: grid; place-items: center; background: #17171c; color: white';
playable.container.append(button);

button.addEventListener('click', () => {
  button.textContent = 'You played!';
  button.disabled = true;
  playable.complete('success');
});
```

`playable.ready()` initializes the host and required resources. Mount the application inside
`playable.container`. Calling `complete('success')` reports a terminal outcome; your application
is responsible for displaying its completion UI or endcard.

## Up and Running

Add these scripts to `package.json`, retaining its existing dependencies and `"type": "module"`:

```json
{
  "scripts": {
    "dev": "replayable dev",
    "build": "replayable build",
    "export": "replayable export"
  }
}
```

::: code-group

```sh [npm]
npm run dev
```

```sh [pnpm]
pnpm dev
```

:::

Open the URL printed in your terminal. You should see a button labeled **Tap to play**. Clicking
it changes the label to **You played!** and completes the playable. Edit the entry file to try HMR.

## Build and Export

Stop the development server, then run:

::: code-group

```sh [npm]
npm run build
npm run export
```

```sh [pnpm]
pnpm build
pnpm export
```

:::

The build appears at `dist/default/preview/en/index.html`. The exported single-file playable is
`exports/preview_default_en.html`. Export consumes the current build, so rebuild after changing
code, assets or configuration.

::: warning Shared generated files
Development and production write to the same generated asset paths. Stop development before
building the same project. Build also clears its configured output directory.
:::

## What's Next?

- Add resources with [Asset Handling](../reference/assets.md).
- Add renderer support with [Pixi and Spine](../reference/pixi.md).
- Configure networks and languages in [Build and Export](./build-and-export.md).
- Explore the complete [Examples](./examples.md).
