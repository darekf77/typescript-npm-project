
# TO REMEBER
- don override in container core thins *trusted* packages from tnp
- dont use _.lodash function: values or other that may not be supported across all lodash version
- dont override symlink with fs
- node_modules/link_from_another_project_dir is resolving packges not from this node_modules !!! 
      -> dont use links in node_modules
- issue with angular loadChildren: './components/+preview-buildtnpprocess/preview-buildtnpprocess.module#PreviewBuildTnpProcesssModule'
     => just change name to wrong... reload... change to  normal and it will be ok !
  @@@@ RESOLVE WITH NEW ANGULAR IMPORT SYSTEM

# ISSUES
- on windows if development server is running can't move/rename folder
- sometime too much dedupe is a BAD THING
- dont put Class Componentts to input @Input() 
- maximulat call stack exceeded for lazy loading routing -> include router module
- dont us getters in for loop, assign value firt
- should be ONLY ONE VERION of (NG2-REST, MORPHI, RXJS and other...)
- id, shoud be with undefined (TODO temp soluition)
- class properties: arrays and object can't have defult propty
- check if each controller, entity is added to 3 init (index.ts,entites.ts,controlers.ts)
- "assets" relative from html,css ,  "/assets" from scss
- in site, if you are decorating entities REMEMBER to overrirde EntityRepository
- if you are changing environment setting you have to start build (or watch:build) again
- watch for circural typescript dependencies !
- typescipt weird path issue exist stil  :
  import { DIALOG } from '../entities'; // ERROR 
  import { DIALOG } from '../entities/DIALOG'; // OK
// entites is folder and file at the same time, maybe that ?
- DO NOT put watcher on 'src' - it will make webpack build neverend
- CHECK maybe you forgot "@" BEFORE DECORATOR for "Entity, Controller, Repository !!!
- Inside isomorphic app.ts simulator use only ./controller and ./entities:
  import { ProcessController } from './controllers'; // OK 
  import { ProcessController } from './controllers/core/ProcessController'; // error undefined
- angular-lib 'ss-common-ui/module' is not working in src
- DONT DO THAT: export class Helpers extends HelpersLogger {  static JSON = JSON10; } -> nested types problem in angular
- Use Helpers.require instead normal require for minification for backend

# UGLIFY, OBSCURE donts
- eval varaible just single ltter
- require(variable) is not working  (require(''+variable) also sucks)


