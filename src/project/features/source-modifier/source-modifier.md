Lib types     = 'isomorphic-lib'|'angular-lib'
Client types  = 'angular-client'|'angular-lib'|'isomorphic-lib'|'ionic-client'|'electron-client'

# Standalone projects
+ Prevent use of workspace projects

+ Browser compilation for standalone project
  -   (third-party-(angular-lib|isomorphic-lib)-name)
  =>  (third-party-(angular-lib|isomorphic-lib)-name)/browser"

+ Between project not allowed to use (src|components)

# Baseline rules

+ Alone: '(angular-lib-name|isomorphic-lib-name)' 
=>  '(angular-lib-name|isomorphic-lib-name)'/(src|components)
->  not possible to use 'src' from angular-lib anywhere in baseline
->  angular-lib and isomorphic-lib usage is equal

+ Prevention of use builded folder:
-   (angular-lib-name|isomorphic-lib-name)/(browser|browser-for-*|module|dist|bundle|)
=>  (angular-lib-name|isomorphic-lib-name)/(src|components)

+ Prevention of use app souce codes outsite project:
-   ('angular-client'|'angular-lib'|'ionic-client'|'electron-client')/src

+ Browser workspace isomorphic children compilation for client:
-   (workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)
=>  (angular-lib-name|isomorphic-lib-name)/browser-for-"client-name"
-   (third-party-(angular-lib|isomorphic-lib)-name)
=>  (third-party-(angular-lib|isomorphic-lib)-name)/browser"


# Site rules

+ Prevention of use baseline/builded folder:
  -   baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(browser|browser-for-*|module|dist|bundle|)
  => baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)

+ Site join change: 
  -   baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)
  =>  (workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)




# Things to check:
- in backend use imported ts files outside scope
