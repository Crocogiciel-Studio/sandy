import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default defineConfig(
  { ignores: ['out/', 'dist/', 'coverage/'] },
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js'] } },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/core' },
        { type: 'adapters', pattern: 'src/adapters' },
        { type: 'shell', pattern: 'src/shell' },
        { type: 'pty-host', pattern: 'src/pty-host' },
        { type: 'ui', pattern: 'src/ui' },
        { type: 'contracts', pattern: 'src/contracts' },
      ],
      'boundaries/files': [{ category: 'test', pattern: '**/*.test.ts' }],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: true,
          policies: [
            // core is pure TS: no electron, no Node builtins, no other element.
            { from: { element: { type: 'core' } }, allow: { to: { element: { type: 'core' } } } },
            {
              from: { file: { categories: 'test' } },
              allow: { to: { module: { origin: 'external', source: 'vitest' } } },
            },
            {
              from: { element: { types: { anyOf: ['adapters', 'shell'] } } },
              allow: { to: { element: { types: { anyOf: ['core', 'adapters', 'pty-host', 'contracts'] } } } },
            },
            {
              from: { element: { types: { anyOf: ['adapters', 'shell', 'pty-host'] } } },
              allow: { to: { module: { origin: ['external', 'core'] } } },
            },
            {
              from: { element: { type: 'ui' } },
              allow: { to: [{ element: { types: { anyOf: ['ui', 'contracts'] } } }, { module: { origin: 'external' } }] },
            },
          ],
        },
      ],
    },
  },
);
