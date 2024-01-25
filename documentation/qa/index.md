
# QA
## 1. How to create/start single project 
- best for opensource/smaller projects
- can be deployed to github pages
- can be deployed to npm as organization package

1.1. Init code with cli
```
firedev new my-app
code my-app
```

1.2. Start lib/app build in integrated terminal
```
firedev start

# OR to start separated build of app and lib project parts
firedev bw     # it will start lib build from ./src/lib  
firedev baw    # it will start app build from ./src/app*

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
firedev new my-organization-with-apps/main-app
code new my-organization-with-apps
```

2.2. Start lib/app build in integrated terminal
```
firedev start  # it will start lib/app build for default project

// OR if you want to deveop many projects at the same time
firedev bw                       # to start global build
firedev baw  child-name          # to start app build of child
firedev baw  second-child-name   # to start app build of child

# bw => build:watch
# baw => build:app:watch
```
2.3. Select proper debug task in  Visual Studio Code

2.4. Select target app and press f5 in your Visual Studio Code

<p style="text-align: center;"><img src="../__images/organization-debug.png" ></p>

## 3 How to start project in WEBSQL MODE ?
```
firedev new my-organization-or-standalone-app
cd new my-organization-or-standalone-app
firedev start --websql
```
