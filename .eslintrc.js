module.exports = {
    env: {
      browser: true,
      es2021: true,
      node: true,
      jest: true
    },
    extends: [
      'eslint:recommended',
      'plugin:prettier/recommended'
    ],
    plugins: ['jest'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'prettier/prettier': 'error'
    },
    overrides: [
      {
        files: ['test/**/*.js'],
        rules: {
          'jest/no-disabled-tests': 'warn',
          'jest/no-focused-tests': 'error',
          'jest/no-identical-title': 'error',
          'jest/prefer-to-have-length': 'warn',
          'jest/valid-expect': 'error'
        }
      }
    ]
  };