# SOURCE MODIFIER

~ use ts pathes and be vocal about it 

Lib types     = 'isomorphic-lib'|'angular-lib'
Client types  = 'angular-client'|'angular-lib'|'isomorphic-lib'|'ionic-client'|'electron-client'



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


# Site rule

+ ONlY APPLY TO CUSTOM FOLDER:

+ Prevention of use baseline/builded folder:
  -   baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(browser|browser-for-*|module|dist|bundle|)
  => baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)

+ Site join change: 
  -   baseline/(workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)
  =>  (workspace-child-(angular-lib|isomorphic-lib)-name)/(src|components)


# Standalone projects (not important yet)
+ Prevent use of workspace projects (tnp-bundle)

+ Browser compilation for standalone project
  -   (third-party-(angular-lib|isomorphic-lib)-name)
  =>  (third-party-(angular-lib|isomorphic-lib)-name)/browser"

+ Between project not allowed to use (src|components)


# Things to check:
- in backend use imported ts files outside scope



----------------------------------------------------------------------------------------------------
angular-lib             
  + app/src    
    - other-angular-lib-name/(folders) -> other-angular-lib-name/browser-for-angular-lib
    - angular-lib-name-itself/(folders) -> components
    - parentfolder/angular-lib-name-itself/(folders) -> components
    - baseline/isomorphic-and-angular-libs-names/(folders) -> not allowed if this is not site

anguliar-lib in site       
  + custom/app/src
    - @app/src
    - baseline/angular-libs-names/(folders) => - baseline/angular-libs-names/components
    - baseline/isomorphic-lib-names/(folders) => - baseline/isomorphic-libs-names/src
----------------------------------------------------------------------------------------------------
