module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: 'detect',
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
            },
        },
    },
    plugins: ['unused-imports'],
    env: {
        browser: true,
        amd: true,
        node: true,
    },
    extends: [
        'next',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
        'plugin:storybook/recommended',
    ],
    rules: {
        'arrow-body-style': 'error',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'react/display-name': 'off',
        '@next/next/no-img-element': 'off',
        'react/prop-types': 'off',
        'import/no-anonymous-default-export': 'off',
        'prettier/prettier': [
            'error',
            {},
            {
                usePrettierrc: true,
            },
        ],
        'jsx-a11y/media-has-caption': 'off',
        'react/react-in-jsx-scope': 'off',
        'jsx-a11y/no-onchange': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/anchor-is-valid': [
            'error',
            {
                components: ['Link'],
                specialLink: ['hrefLeft', 'hrefRight'],
                aspects: ['invalidHref', 'preferButton'],
            },
        ],
        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal'],
                pathGroups: [
                    {
                        pattern: 'react',
                        group: 'external',
                        position: 'before',
                    },
                    {
                        pattern: 'styles',
                        group: 'internal',
                        position: 'after',
                    },
                ],
                pathGroupsExcludedImportTypes: ['react'],
                alphabetize: {
                    order: 'asc',
                },
            },
        ],
    },
};
