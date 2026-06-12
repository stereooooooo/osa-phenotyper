// Focused ESLint config for the no-build vanilla OSA Phenotyper app.
//
// Headline rule: `no-use-before-define` (variables) guards the documented
// temporal-dead-zone trap — a `const` declared later in the form-submit
// handler but referenced earlier (see CLAUDE.md "Common Pitfalls"). The rest
// are zero-false-positive correctness rules. Kept intentionally small so it
// stays green on the existing client-side code without adding a build step.
//
// Scope: the browser `js/` modules only. The AWS Lambda code under
// `infrastructure/` is ESM/Node and is linted (if at all) separately.

export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script', // classic <script> files, not ES modules
    },
    rules: {
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
      'no-const-assign': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      'no-func-assign': 'error',
      'valid-typeof': 'error',
    },
  },
];
