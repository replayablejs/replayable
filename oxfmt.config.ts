import { defineConfig } from 'oxfmt';

export default defineConfig({
  overrides: [
    {
      files: ['**/*.json', '**/*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
  printWidth: 100,
  singleQuote: true,
  sortImports: true,
  trailingComma: 'all',
});
