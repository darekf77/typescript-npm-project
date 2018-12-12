# tsc-npm-project (alpha)

Helper project for my typescript npm libraries.




# TO REMEBER
- issue with angular loadChildren: './components/+preview-buildtnpprocess/preview-buildtnpprocess.module#PreviewBuildTnpProcesssModule'
     => just change name to wrong... reload... change to  normal and it will be ok !
- should be ONLY ONE VERION of (NG2-REST, MORPHI, RXJS and other...)
- id, shoud be with undefined (TODO temp soluition)
- class properties: arrays and object can't have defult propty
 - check if each controller, entity is added to 3 init (index.ts,entites.ts,controlers.ts)
 - "assets" relative from html,css ,  "/assets" from scss
- in site, if you are decorating entities REMEMBER to overrirde EntityRepository
- if you are changing environment setting you have to start build (or watch:build) again
- watch for circural typescript dependencies !
- typescipt weird path issue exist stil  :
import { DIALOG } from '../entities'; // ERROR 
import { DIALOG } from '../entities/DIALOG'; // OK
// entites is folder and file at the same time, maybe that ?
- DO NOT put watcher on 'src' - it will make webpack build neverend
BUILDS are only projects :
 - worksapces (that contains with childen | with childen previews)
 - standalone (that contains with childen previews)

## Create, build, publish:
- isomorphic typescript library
- angular library

---


- General
    - compare global packages versions, install local addtional packages
    - global tool
    - in *package.json* filed configuration 
    - generated project out of box ready to **npm link**
    - temporary folder:
        - *dist* - current build (static or for watching)
        - *bundle* - for realse npm package purpose (angular-lib,isomorphc-lib)
    - **tnp release** for build, commit and publish production (path)
    - **tnp (clean|clear):(prod|dev)** remove production od development build
    - **tnp (clean|clear):all** remove all builds, node_modules
    - **tnp task:start** npm-check, install node_modules, run **quick development watching build**
- Create
    - isomorphic-lib
        - preview (nodejs typescript | angular) app
    - angular-lib
        - preview angular app
    - angular-client        
- Build
    - quick development build with *ctrl*(*cmd*)+*shift*+*b*
    - **tnp build** for production build in *bundle*
- Publish
    - from *bundle* folder
    - resources.json for needed things in bundle
    - *tnp publish* for publishing production build (path)
- Configuration in package.json
    - type of project
    - resouces for production build
```json
...
    "tnp":{
        "type":"isomorphic-lib | angular-lib",
        "resources: [
            "images",
            "configs"
            // ... package.json already include in production build
        ]
    }
...
```
