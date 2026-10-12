import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'shots', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.js', '*.mjs', 'public/*.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs', '*.js', 'public/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs', '*.js', 'public/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
