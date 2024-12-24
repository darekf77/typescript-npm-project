@deprecated

## Debugging 

### Verbose mode

Add -verbose flag to any command to see more of debugging data

```
tnp any-tnp-command -verbose
```




## Creating 

### Creating apps/libs as standalone or smart container (organization) projects

```
tnp new my-standalone-lib-app
tnp new my-workspace/my-workspace-child-lib-app
tnp container my-new-container
```

## Building

### Initing / clearing temporary files for project 
Everytime you are starting lib build or you wan't to clear all project
temporary data.. use these commands
```
tnp clear
tnp cl
tnp init ## => is a part of lib build and you don't need to use it

```

### Building libs/apps at the same time in one process

Quicket way to start local development of app and lib build in the same process

```
## global lib build with angular app
tnp start
tnp start --port 4444
tnp start --websql
```


### Building libs code

Don't waste your local resources and build/serve only things that you need

```
## lib build
tnp build
tnp build:watch
tnp b
tnp bw

## app build
tnp app
tnp app child-project-name
```

## Releasing

### Releasing to npm repository or/and  github/gitlab pages

Easy release of app or libs for standalone/organization projects

```
## path release
tnp release
tnp patch:release
tnp r
tnp release
tnp automatic:release
tnp ar

## minor release
tnp minor:release
tnp minor

## major relase
tnp major:release
tnp major

tnp set:major:ver 14 ## can be done in container for all pacakges
```

## Testing

Unit/Integration testing

### Unit (jest)
```
tnp t
tnp test
tnp test:watch
tnp test:watch:debug
tnp test:updatesnaphot

tnp test:updatesnaphot
tnp tu
```

### E2E (playwright)
```
tnp e2e
tnp e2e:watch
tnp e2e:watch:debug
```


