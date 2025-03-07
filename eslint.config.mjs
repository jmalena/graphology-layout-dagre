// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsdoc from 'eslint-plugin-tsdoc';
import tsdocRequire from 'eslint-plugin-tsdoc-require';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/docs',
    ]
  },
  {
    plugins: {
      tsdoc,
      'tsdoc-require': tsdocRequire,
    },
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
    ],
    rules: {
      'tsdoc/syntax': 'warn',
      'tsdoc-require/require': 'warn',
      // when an unused variable has an underscore prefix, suppress the unused variable error
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }
      ]
    }
  },
);
