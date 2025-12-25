import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'client/dist/**',
      'server/dist/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./server/tsconfig.json', './shared/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['log', 'info', 'warn', 'error'] }],
    },
  }
);
