# Npm App/Libs

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
# Standalone/Organization project structure
- **Organization project (smart container)** has many "small" **standalone projects** inside itself.
- Standalone projects can be also use as global cli terminal tools
- In ANY firedev project property "name" in package.json MUST be equal project's folder basename
- organization subprojects can be easily transformed to standalone projects just by taking them out of smart container

<p style="text-align: center;"><img src="./__images/code-structure.png" ></p>
