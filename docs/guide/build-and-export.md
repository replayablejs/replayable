# Build and Export

A build produces runnable browser files. Export turns those files into the delivery format for
each configured network. Run both steps after changing application code, configuration or assets.

## Select Variants

Add networks and languages to the project configuration:

```ts
// Fields inside defineConfig({ ... })
networks: {
  preview: {},
  google: { audio: false },
  meta: {},
},
localization: {
  languages: ['en', 'es'],
  fallback: 'en',
},
```

These settings produce six variants for the default project version. `versions` can add ad
variations; it does not refer to the toolkit's npm version. Preview supports local testing, while
the other profiles select delivery-specific behavior.

## Produce Delivery Files

```sh
npm run build
npm run export
```

Build resets `dist` and writes one directory per version/network/language combination. Export
writes files such as `preview_default_en.html` and `google_default_es.zip` into `exports`.
The [export reference](../reference/export.md) describes validation and size limits.

::: warning Check the destination
A successful export confirms Replayable's implemented checks. Test the artifact in the intended
network's tools and on the devices you support before delivering a campaign.
:::

## Output Directories

Use `build.outDir` in project configuration for runnable build output. To change the export
destination, run `npx replayable export --output delivery` or `pnpm exec replayable export --output delivery`.
Use dedicated generated directories so source files are not mixed with build output.

## Troubleshooting

- **Missing build files:** run build before export and use the same configuration for both.
- **Output is too large:** inspect source assets and encoding options before rebuilding; the error
  identifies the failing network artifact.
- **Wrong language or variant in development:** select `replayable dev --language en --version default`.
- **Store behavior differs from preview:** store actions are routed through the active network host;
  validate them inside that host with the campaign's actual destinations.
