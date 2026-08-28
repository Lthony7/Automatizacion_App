/*
 * ESLint Configuration for Content Automation Platform API
 * FASE 9.6: flat config (ESLint 9+/10) — resolves parser from web's node_modules if needed.
 */

let tsParser, tsPlugin;
try {
  tsParser = require('@typescript-eslint/parser');
  tsPlugin = require('@typescript-eslint/eslint-plugin');
} catch (_) {
  const path = require('path');
  const base = path.resolve(__dirname, '../web/node_modules/@typescript-eslint');
  tsParser = require(path.join(base, 'parser/dist/index.js'));
  tsPlugin = require(path.join(base, 'eslint-plugin/dist/index.js'));
}

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs.recommended.rules || {}),
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'test/**', '.next/**'],
  },
];
