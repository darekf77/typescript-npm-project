# Isomorphic code
## Files with special extension and purpose:

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

### All other files can be splited with regions:

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

*When you shoulduse @backend, @backendFunc:*

\-> for deleting code that can't be mocked in websql mode

\+ **Code only for browser:** 

`//#region @browser` 

 /* code */

`//#endregion`

*When you should use @browser*

\-> for frontend code that for some reason can't be executed/imported in NodeJS backend

\+ **Code only for websql mode (not available for nodejs backend):** 

`//#region @websqlOnly`  

/* code */

`//#endregion`

*When you should use @websqlOnly*

\-> when you are converting NodeJS only backend to websql mode friendly backend



