## Versions

-   Next.js 15.0.2
-   React 18.3.1
-   ReactDOM 18.3.1
-   Node 20.x

## Setup

```bash
nvm use         # sets node and npm version
yarn install    # installs required packages
yarn dev        # starts local dev environment
```

### (S)CSS

-   based on **ITCSS** architecture (read about
    it [here](https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/)) and inspired
    by [inuitcss framework](https://github.com/inuitcss/inuitcss)
-   uses postcss by default - autoprefixer will automatically add vendor prefixes
    by [browserslist ruleset defined inside package.json](https://github.com/postcss/autoprefixer#browsers)

### Scripts

```bash
yarn dev      # build and watch file changes for development
yarn build    # build for production
yarn start    # run the application
yarn lint     # lint scss and js files with stylelint
yarn format   # format scss and js files with prettier
```
