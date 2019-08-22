
# Build isomorphi lib:


### Usage of region **@backend**
```ts
import { Morphi } from 'morphi'

console.log('visible everywhere')
//#region @backend
console.log('visible in backend only')
//#endregion
if(Morphi.IsBrowser) {
  console.log('visible everywhere, but only in browser')
}

```

### Usage of region **@backendFunc**
```ts
import { Morphi } from 'morphi'


class MyController {

  getSecrets() {
    //#region @backendFunc
      
    //#endregion
  }


}


```
