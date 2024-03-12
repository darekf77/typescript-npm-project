
# Build isomorphi lib:


### Usage of region **@backend**
```ts
import { Firedev } from 'firedev'

console.log('visible everywhere')
//#region @backend
console.log('visible in backend only')
//#endregion
if(Helpers.isBrowser) {
  console.log('visible everywhere, but only in browser')
}

```

### Usage of region **@backendFunc**
```ts
import { Firedev } from 'firedev'


class MyController {

  getSecrets() {
    //#region @backendFunc
      
    //#endregion
  }


}


```
