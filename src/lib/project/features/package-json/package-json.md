# Package.json

# Firedev secion
```
"tnp": {
    "resources": [
      "README.md",
      "screen.png"
    ],
    "isCoreProject": false,
    "type": "angular-lib",
    "overrided": {
      "ignoreDepsPattern": [],
      "includeAsDev": "*",
      "includeOnly": [],
      "dependencies": {}
    },
    "isGenerated": false,
    "useFramework": false
  },
```
#### tnp.override.dependencies
Override inherited automaticly depencencies with your own
Possible values:
 - "dependency-name1": null -> delete dependecny
 - "dependency-name1": "1.2.3" -> override dependency version

#### tnp.override.includeOnly
Inlcude in version for publishing only this 
dependencies inluded in this array

#### tnp.override.ignoreDepsPattern
Inlcude in version for publishing only this 
dependencies that doesn't match this pattern


#### tnp.override.includeAsDev
Two possible values:
  - "*" -> all depnecies become devDependevices
  - ["dep=name1","dep-name2"] -> only dependencies in array become devDependencies
