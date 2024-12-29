## Creating new project
```bash
tnp new my-standalone-project
tnp new my-organization/main-entry-project
```

## Isomorphic/library build
```bash 
tnp build # Typescript tsc + Angular ng build
tnp b

tnp build:watch
tnp bw
```

## Angular app build
```bash
tnp app # normal angular ng serve + docker run
tnp app --websql # start ng serve in special "backend inside browser" mode
```

## Combined **Angular app build** and **Isomorphic/library build**
Combined Angular/TypeScript/Node build is sometime useful is you want to just 
start everything *fast*.
```bash
tnp start
tnp s

tnp start --websql 
tnp s --websql 
```

## Running nodejs backend app 
Usually you **don't** use this command for development 

-> **debugger** from Visual Studio Code is for this 
(F5 on keyboard, Task "Debug/Start Server"). 
```bash
tnp run
```

## Migrations (for databases)
```bash
tnp migration # migration menu
tnp m

# create migration file (with classes for all detected contexts)
tnp migration:create 
tnp mc

 # run all migrations (for all contexts)
tnp migration:run   # similar to 'tnp run', but won't start express
tnp mr              # server and it will stop after contexts
                    # initialize() functions...

 # revert migration to timestamp
tnp migration:revert timestamp  # similar to 'tnp run', but won't start express
tnp mr timestamp                # server and it will stop after contexts
                                # initialize() functions...
```

## Documentation (mkdocs , storybook, compodoc) build
```bash
tnp docs
tnp d

tnp docs:watch
tnp dw
```

## Testing
```bash
# Unit/Integration tests
tnp test
tnp t

tnp test:watch
tnp tw

tnp test:up:snapshots
tnp tu

# E2e testing
tnp test
tnp t

tnp test:watch
tnp tw

tnp test:up:snapshots
tnp tu
```

## Release

```bash
# show menu
tnp release
tnp r

# release of all possible artifacts
# (npm lib, cli tool, be/fe app, docs, electron app, vscode plugin, mobile app)
# without asking question.
# THIS COMMAND WILL ONLY WORK IF YOU ALREADY WENT THROUGH ALL ARTIFACTS 
# RELEASE QUESTIONS.
tnp automatic:release
tnp ar
```
Release of artifacts
```bash
# release lib or (libs in container) to npm
tnp release:lib
tnp rlib
tnp automatic:lib:release 
tnp arlib 

# release cli tool or (multiple cli-s tools in container)
tnp release:cli
tnp rcli
tnp automatic:cli:release 
tnp arcli 

# release website backend/frontend app to cloud
tnp release:app
tnp rapp
tnp automatic:app:release 
tnp arapp 

# release docs website to special branch
tnp release:docs
tnp rdocs
tnp automatic:docs:release 
tnp ardocs 

# release  electron app to cloud
tnp release:electron
tnp relectron
tnp automatic:electron:release 
tnp arelectron 

# release vscode extension/plugin
tnp release:vscode
tnp rvscode
tnp automatic:vscode:release 
tnp arvscode 

# release mobile app
tnp release:mobile
tnp rvmobile
tnp automatic:mobile:release 
tnp armobile 
```
