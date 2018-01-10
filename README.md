# tsc-npm-project (alpha)

Helper project for my typescript npm libraries.


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
        - *dist* - current development build
        - *bundle* - current production build
    - **tnp release** for build, commit and publish production (path)
    - **tnp (clean|clear):(prod|dev)** remove production od development build
    - **tnp (clean|clear):all** remove all builds, node_modules
    - **tnp task:start** npm-check, install node_modules, run **quick dev build**
- Create
    - isomorphic-lib
        - preview (nodejs typescript | angular) app
    - angular-lib
        - preview angular app
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
