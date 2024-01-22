# Introduction

## Why firedev?

**Firedev** 🔥🔥🔥 is a solution for

\+
[typescript](https://www.typescriptlang.org/)  

\+
[angular](https://angular.io/) 

\+
[rxjs](https://rxjs.dev/)  / [ngrx](https://ngrx.io/) (optional) 

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

backend/frontend [*isomorphic](https://en.wikipedia.org/wiki/Isomorphic_JavaScript)  libs/apps with *isomorphic code*.

<br/><br/>
<br/><br/>
<br/><br/>
<br/><br/>
<br/><br/>

## Philosophy of Firedev
### 1. One language for browser/backend/database - **TypeScript**

### 2 .Builded on top of rock solid frameworks

### 3. **Never** ever **repeat** single line of **code**

### 4. Everything automatically generated, strongly typed

### 5. Crazy fast / developer-friendly coding in <b>Visual Studio Code</b>

### 6.  Shared <b>node_modules</b> for similar projects (from one big npm pacakges container)
    **No need for local node_modules** => many projects takes megabytes instead gigabytes

### 8. Automation for releasing projects (standalone and organization) to github pages / npm repositories

### 9.  Develop libraries and apps at the same time! (mixed NodeJs packages with proper Angular ivy packages)

### 10.  Assets from project can be shared with npm package! (only those from **/src/assets/shared**)

=> Two development modes
  1. NORMAL - sqlite/mysql for database and normal NodeJS server
  ```
  firedev start # in any project
  ```
  2. WEBSQL - sql.js for database/server in browser development mode
  ```
  firedev start --websql  # in any project
  ```


=> WEBSQL mode is a perfect solution for:

*\+ github pages serverless demo apps with "almost" full functionality!* 

*\+ e2e/integration tests*

*\+ local NodeJS/database development without starting NodeJS server!*
