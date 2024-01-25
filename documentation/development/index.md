# Development of Apps/Libs

## Standalone projects
\+ Create new standalone app (simple project, cli tools or entry projects for big applications)
that can be relaased in npm as normal packages
(example **my-standalone-app**)
```
firedev new my-standalone-app
```
---

## Organization projects
\+ Create new organization app (for complex projects)
that can be released in npm as organization packages 
(example **@organization/my-app-or-lib **)
```
firedev new organization/my-app-or-lib 

# and then you can add another one:

firedev new organization/my-next-app-lib
```
---
\+ Release app to github pages or/and npm
```
firedev release

firedev ar # quick patch release of lib to npm 
firedev adr # quick release of app to github with last configuration
```
---

\+ Synchronize latest global firedev's packages container
```
firedev sync
```
\+ Update firedev from npm and local container from npm packages
```
firedev au  #  auto:update

# above command will also perform "firedev sync" 
```
---
\+ Check firedev version
```
firedev version
```
## Projects structure
- **Organization project (smart container)** has many "small" **standalone projects** inside itself.
- Standalone projects can be also use as global cli terminal tools
- In ANY firedev project property "name" in package.json MUST be equal project's folder basename
- organization subprojects can be easily transformed to standalone projects just by taking them out of smart container

<p style="text-align: center;"><img src="../__images/code-structure.png" ></p>

## CLI commands

### Firedev auto-update

Triger auto-update of firedev's global cli tool and core containers

```
firedev autoupdate
firedev au
```


### Verbose mode

Add -verbose flag to any command to see more of debugging data

```
firedev any-firedev-command -verbose
```

### Creating apps/libs as standalone or smart container (organization) projects

```
firedev new my-standalone-lib-app
firedev new my-workspace/my-workspace-child-lib-app
firedev container my-new-container
```

### Initing / clearing temporary files for project 
Everytime you are starting lib build or you wan't to clear all project
temporary data.. use these commands
```
firedev clear
firedev cl
firedev init # => is a part of lib build and you don't need to use it

```

### Building libs/apps at the same time in one process

Quicket way to start local development of app and lib build in the same process

```
# local lib build
firedev start
firedev start --port 4444
firedev start --websql
firedev s

# global lib build
firedev start:watch 
firedev sw 
```


### Building libs code

Don't waste your local resources and build/serve only things that you need

```
# local lib build
firedev build:dist
firedev bd
firedev build:dist:watch
firedev bdw
firedev build:bundle
firedev bb
firedev build:bundle:watch
firedev bbw

# global lib build
firedev build:watch  
firedev bw

# revert global lib build of package(s) to original state
firedev revert
firedev rev

# app build
firedev build:app
firedev ba
firedev build:app child-project-name
firedev ba child-project-name
firedev build:dist:app
firedev bda
firedev build:dist:app:watch
firedev bdaw
firedev build:bundle:app
firedev bba
firedev build:bundle:app:watch
firedev bbaw
```

### Releasing to npm repository or/and  github/gitlab pages

Easy release of app or libs for standalone/organization projects

```
# path release
firedev release
firedev patch:release
firedev r
firedev release --all   # for release and omit cache
firedev automatic:release
firedev ar

# minor release
firedev minor:release
firedev minor

# major relase
firedev major:release
firedev major

firedev set:major:ver 14 # can be done in container for all pacakges
```

### Github pushing/puling projects

Puling and pushing git repos. Organization projects (smart containers) can be monorepos
or childs can be split just like in containers.

```
firedev pull
firedev push
firedev pullall
firedev reset
firedev rebase
firedev push:feature 
firedev pf
firedev push:fix 
firedev pfix
```

### Testing

Unit/Integration testing

```
firedev test
firedev test:watch
firedev test:watch:debug
```


### Firedev project update

Update firedev project configuration (linked project, firedev framework versiopn etc.)

```
firedev update
firedev up
```

### Firedev extension for Visual Studio Code 

Install vscode plugin

```
firedev vscode:ext
firedev ext
```

## Rules of writing firedev code
### Files with special extension and purpose:

\+ Frontend only files (available also in websql backend mode)
 
- ***.browser.ts** (-- any file --)
- ***.component.ts** *(angular components)*
- ***.container.ts** *(angular container components)*
- ***.directive.ts**  *(angular directives)*
- ***.pipe.ts**  *(angular pipes)*
- ***.module.ts** *(angular modules)*
- ***.service.ts** *(angular services)*
- ***.store.ts** *(ngrx store)*
- ***.actions.ts**  *(ngrx actions )*
- ***.effects.ts** *(ngrx effects)*
- ***.reducers.ts** *(ngrx directives)*
- ***.selectors.ts** *(ngrx selectors)*
- ***.routes.ts** *(angular router files)*
- ***.spec.ts** *(jest tests files)*
- ***.cy.ts** *(cypress tests files)*

additionaly **all .css, sass, .html** are not available for nodej backend code

\+ Backend only files (available also in websql mode)
 
- ***.test.ts** *(mocha/sinon backend tests)*

\+ Backend only files (not available in websql mode => only nodejs)
 
- ***.backend.ts** *(nodejs backend code)*

PLEASE REMEMBER THAT **example-file-name-backend.ts** is NOT a nodejs-backend only code

--- 

### Code regions 

\+ **Code for nodejs/websql backend:** 

`//#region @websql`

  /* code */
  
   `//#endregion`

\+ **Same as above for function return :**

`//#region @websqlFunc`

  /* code */
  
   `//#endregion`

*When you should use @websql, @websqlFunc:*

\-> have in mind that this code can be mocked in browser in websql mode

\-> you should use it more often that @backend, @backendFunc

\-> ..why? => websql mode is super confortable for development

\+ **Code only for nodejs backend:**

`//#region @backend`

  /* code */ 
  
  `//#endregion`

\+ **Same as above for function return:**

`//#region @backendFunc`
  
  /* code */
  
`//#endregion`

*When you should use @backend, @backendFunc:* ?

\-> for deleting code that can't be mocked in websql mode

\+ **Code only for browser:** 

`//#region @browser` 

 /* code */

`//#endregion`

*When you should use @browser* ?

\-> for frontend code that for some reason can't be executed/imported in NodeJS backend

\+ **Code only for websql mode (not available for nodejs backend):** 

`//#region @websqlOnly`  

/* code */

`//#endregion`

*When you should use @websqlOnly* ?

\-> when you are converting NodeJS only backend to websql mode friendly backend



