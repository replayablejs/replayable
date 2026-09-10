import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  ignorePatterns: ['**/dist/**', '**/coverage/**', '**/assets/out/**'],
  options: {
    typeAware: true,
  },
  plugins: ['typescript', 'vitest', 'promise', 'node', 'import'],
  rules: {
    curly: 'error',
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
  },
});
