import { fixupPluginRules } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.astro'],
    plugins: {
      astro: fixupPluginRules(astro),
    },
    languageOptions: {
      parser: astro.parseAstro,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      ...astro.configs.recommended.rules,
      ...astro.configs['jsx-a11y-recommended'].rules,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      prettier: fixupPluginRules(prettier),
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
