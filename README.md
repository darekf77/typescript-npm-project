## Build helper for typescript like, npm projects

### Example project

Require structure for new typescript/npm project:

```
├── index.ts # main file
├── .gitignore
├── .npmignore
├── package.json
├── README.md
├── src
|  └── project-file.ts
└── tsconfig.json
```
Commnads to build project:
`
npm run build
`

Commnads to build and publish: project:
`
npm run build:publish
`

```
Example package json
```json
{
  "name": "npm-project-name",
  "version": "0.0.1",
  "description": "Build and publish typescript projects to npm",
   "main": "./index.js",
    "types": "./index.d.ts",
  "scripts": {
   "build": "./node_modules/.bin/ts-node ./node_modules/typescript-npm-project/index.ts",
    "build:publish": "./node_modules/.bin/ts-node ./node_modules/typescript-npm-project/index.ts --publish"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/darekf77/typescript-npm-project.git"
  },
  "keywords": [ ],
  "author": " Your name ",
  "license": "MIT",
  "dependencies": {
    "ts-node": "3.3.0"
  },
  "devDependencies": {
    "@types/node": "8.0.53"
  }
}
````




Example tsconfig
```json
{
    "compileOnSave": true,
    "compilerOptions": {
        "declaration": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "module": "commonjs",
        "skipLibCheck": true,
        "sourceMap": true,
        "target": "es2016",
        "typeRoots": [
            "node_modules/@types"
        ],
        "outDir": "dist"
    },
    "include": [
        "index.ts"
    ]
}

```

Reference
- https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
