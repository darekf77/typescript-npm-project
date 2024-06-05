# Introduction

## What is firedev?

**Firedev** 🔥🔥🔥 is a solution (**global cli tool** & **framework**) for

\+
[typescript](https://www.typescriptlang.org/)

\+
[angular](https://angular.io/)

\+
[rxjs](https://rxjs.dev/) / [ngrx](https://ngrx.io/) (optional)

\+
[nodejs](https://nodejs.org/en/)

\+ [typeorm](https://typeorm.io/)

- [sqlite](https://github.com/WiseLibs/better-sqlite3) - SUPPORTED
- [sql.js](https://sql.js.org) - SUPPORTED IN WEBSQL MODE
- [mysql](https://www.mysql.com/) - support in progress
- [postgress](https://www.postgresql.org) - support in progress
- [mongo](https://www.postgresql.org) - support in progress

\+
[electron](https://www.electronjs.org/) (support in progress)

\+
[cordova](https://cordova.apache.org/) (support in progress)

<ins>backend/frontend [\*isomorphic](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) apps/libs.</ins>

<br/><br/>
<br/>

## Philosophy of Firedev

### 1. One language for browser/backend/database - **TypeScript**

### 2 Rock solid frameworks as foundation.

### 3. **Never** ever **repeat** single line of **code**

only possible with isomorphic code

### 4. Everything automatically generated, strongly typed

### 5. Fast/developer-friendly coding in <b>Visual Studio Code</b>

### 6. Every package available everywhere - shared <b>node_modules</b> for similar projects

Firedev has one big npm pacakges container (located in: ~/.firedev/firedev/projects/container-v4 - )
**There is no need for local node_modules** => many projects takes megabytes instead gigabytes

### 8. Automation for releasing projects (standalone and organization) to github pages / npm repositories

### 9. Develop libraries and apps at the same time! (mixed NodeJs packages with proper Angular ivy packages)

### 10. Assets from project can be shared with npm package! (only those from **/src/assets/shared**)

### 11. Websql development mode

1. NORMAL - sqlite/mysql for database and normal NodeJS server

```
firedev start # in any project
```

2. WEBSQL - sql.js for database/server in browser development mode

```
firedev start --websql  # in any project
```

> WEBSQL mode is a perfect solution for:

_\+ github pages serverless demo apps with "almost" full functionality!_

_\+ e2e/integration tests_

_\+ local NodeJS/database development without starting NodeJS server!_
