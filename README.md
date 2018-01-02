# tsc-npm-project (alpha)

Helper project for my typescript npm libraries.


## Create, build, publish:
- isomorphic typescript library
- angular library

---

- General
    - global tool
    - package.json **tnp-project-type**:
        - isomorphic-lib
        - angular-lib
    - generated project out of box ready to **npm link**
    - temporary folder:
        - *dist* - current development build
        - *bundle* - current production build
    - *tnp release* for build, commit and publish production (path)
    - *tnp (clean|clear):(prod|dev)* remove production od development build
    - *tnp (clean|clear):all* remove all builds, node_modules
    - *tnp task:start* npm-check, install node_modules, run **quick dev build**
- Build
    - **quick dev build** with *ctrl*(*cmd*)+*shift*+*b*
    - *npm run build* for production build in *bundle*
- Publish 
    - from *bundle* folder
    - resources.json for needed things in bundle
    - *tnp publish* for publishing production build (path)
 

