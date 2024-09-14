
# QA
## 1. How to create/start single project 
- best for opensource/smaller projects
- can be deployed to github pages
- can be deployed to npm as organization package

1.1. Init code with cli
```
taon new my-app
code my-app
```

1.2. Start lib/app build in integrated terminal
```
taon start

# OR to start separated build of app and lib project parts
taon bw     # it will start lib build from ./src/lib  
taon baw    # it will start app build from ./src/app*

# bw => build:watch
# baw => build:app:watch
```

1.3. Select proper debug task in  Visual Studio Code

1.4. Press f5 in your Visual Studio Code

## 2 How to create/start organization project
- best private/complex application
- can be deployed to github pages
- can be deployed to npm as organization package

2.1 Init code with cli
```
taon new my-organization-with-apps/main-app
code new my-organization-with-apps
```

2.2. Start lib/app build in integrated terminal
```
taon start  # it will start lib/app build for default project

// OR if you want to deveop many projects at the same time
taon bw                       # to start global build
taon baw  child-name          # to start app build of child
taon baw  second-child-name   # to start app build of child

# bw => build:watch
# baw => build:app:watch
```
2.3. Select proper debug task in  Visual Studio Code

2.4. Select target app and press f5 in your Visual Studio Code

<p style="text-align: center;"><img src="../assets/images/organization-debug.png" ></p>

## 3 How to start project in WEBSQL MODE ?
```
taon new my-organization-or-standalone-app
cd new my-organization-or-standalone-app
taon start --websql
```
