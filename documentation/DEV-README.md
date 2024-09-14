# Development of Apps/Libs

## Standalone projects
\+ Create new standalone app (simple project, cli tools or entry projects for big applications)
that can be relaased in npm as normal packages
(example **my-standalone-app**)
```
taon new my-standalone-app
```
---

## Organization projects
\+ Create new organization app (for complex projects)
that can be released in npm as organization packages 
(example **@organization/my-app-or-lib **)
```
taon new organization/my-app-or-lib 

# and then you can add another one:

taon new organization/my-next-app-lib
```
---
\+ Release app to github pages or/and npm
```
taon release

taon ar # quick patch release of lib to npm 
taon adr # quick release of app to github with last configuration
```
---

\+ Synchronize latest global taon's packages container
```
taon sync
```
<!-- \+ Update taon from npm and local container from npm packages
```
taon au  #  auto:update

# above command will also perform "taon sync" 
```
--- -->
\+ Check taon version
```
taon version
```
## Projects structure
- **Organization project (smart container)** has many "small" **standalone projects** inside itself.
- Standalone projects can be also use as global cli terminal tools
- In ANY taon project property "name" in package.json MUST be equal project's folder basename
- organization subprojects can be easily transformed to standalone projects just by taking them out of smart container

<p style="text-align: center;"><img src="../assets/images/code-structure.png" ></p>

## CLI commands

### Taon auto-update

Triger auto-update of taon's global cli tool and core containers

```
taon autoupdate
taon au
```


### Verbose mode

Add -verbose flag to any command to see more of debugging data

```
taon any-taon-command -verbose
```

### Creating apps/libs as standalone or smart container (organization) projects

```
taon new my-standalone-lib-app
taon new my-workspace/my-workspace-child-lib-app
taon container my-new-container
```

### Initing / clearing temporary files for project 
Everytime you are starting lib build or you wan't to clear all project
temporary data.. use these commands
```
taon clear
taon cl
taon init # => is a part of lib build and you don't need to use it

```

### Building libs/apps at the same time in one process

Quicket way to start local development of app and lib build in the same process

```
# global lib build with angular app
taon start
taon start --port 4444
taon start --websql
```


### Building libs code

Don't waste your local resources and build/serve only things that you need

```
# lib build
taon build
taon build:watch
taon b
taon bw

# app build
taon app
taon app child-project-name
```

### Releasing to npm repository or/and  github/gitlab pages

Easy release of app or libs for standalone/organization projects

```
# path release
taon release
taon patch:release
taon r
taon release
taon automatic:release
taon ar

# minor release
taon minor:release
taon minor

# major relase
taon major:release
taon major

taon set:major:ver 14 # can be done in container for all pacakges
```

### Github pushing/puling projects

Puling and pushing git repos. Organization projects (smart containers) can be monorepos
or childs can be split just like in containers.

```
taon pull
taon push
taon pullall
taon reset
taon rebase
taon push:feature 
taon pf
taon push:fix 
taon pfix
taon pchore
taon pc
taon prefactor
taon pref
```

### Testing

Unit/Integration testing

```
taon test
taon test:watch
taon test:watch:debug
```


### Taon project update

Update taon project configuration (linked project, taon framework versiopn etc.)

```
taon update
taon up
```

### Taon extension for Visual Studio Code 

Install vscode plugin

```
taon vscode:ext
taon ext
```

## Rules of writing taon code
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



