//#region imports
import { IncrementalWatcherOptions, incrementalWatcher } from "incremental-compiler/src";
import { Project } from "../abstract/project";
import { config } from "tnp-config/src";
import { crossPlatformPath, path, _, PROGRESS_DATA, chalk, glob, os, fse, CoreModels } from "tnp-core/src";
import { TAGS, backendNodejsOnlyFiles, extAllowedToExportAndReplaceTSJSCodeFiles, frontendFiles, notNeededForExportFiles } from 'tnp-config/src';
import { Helpers, BaseCommandLine } from "tnp-helpers/src";
import { PackagesRecognition } from "../features/package-recognition/packages-recognition";
import { BrowserCodeCut } from "../compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend";
import { CLI } from "tnp-cli/src";
import { Models } from '../../models';
import * as  psList from 'ps-list';
import { MESSAGES, firedevRepoPathUserInUserDir } from '../../constants';
import { MagicRenamer } from "magic-renamer/src";
declare const ENV: any;
//#endregion

class $Global extends BaseCommandLine<{}, Project> {
  public _() {
    Helpers.error('Please select proper command.', false, true);
    this._exit()
  }

  //#region kill process on port
  async killonport() {
    const port = parseInt(this.firstArg)
    await Helpers.killProcessByPort(port);
    this._exit();
  }
  //#endregion

  //#region kill all node processes
  killAllNode() {
    Helpers.killAllNode();
    this._exit();
  }
  //#endregion

  //#region kill vscode processes
  killAllCode() {
    if (process.platform === 'win32') {
      Helpers.run(`taskkill /f /im code.exe`).sync();
      this._exit()
    } else {
      Helpers.run(`fkill -f code`).sync();
    }
    this._exit()
  }
  //#endregion

  //#region fork
  fork() {
    const argv = this.args;
    const githubUrl = _.first(argv);
    let projectName = _.last(githubUrl.replace('.git', '').split('/'));
    if (argv.length > 1) {
      projectName = argv[1];
    }
    Helpers.info(`Forking ${githubUrl} with name ${projectName}`);
    this.project.git.clone(githubUrl, projectName);
    let newProj = Project.ins.From(path.join(this.project.location, projectName)) as Project;
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'name', projectName);
    Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'version', '0.0.0');
    if (newProj.containsFile('angular.json')) {
      Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.type', 'angular-lib');
      Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'tnp.version', 'v2');
      Helpers.setValueToJSON(path.join(newProj.location, config.file.package_json), 'scripts', {});
      // const dependencies = Helpers.readValueFromJson(path.join(newProj.location, config.file.package_json), 'dependencies') as Object;
      newProj.run(`${config.frameworkName} init`).sync();
      newProj = Project.ins.From(path.join(this.project.location, projectName)) as Project;
      newProj.removeFile('.browserslistrc');
    }
    Helpers.writeFile(path.join(newProj.location, config.file.README_MD), `
  # ${projectName}

  based on ${githubUrl}

    `);
    Helpers.run(`code ${newProj.location}`).sync();
    Helpers.info(`Done`);
    this._exit()
  }
  //#endregion

  //#region watcher linux
  watchersfix() {
    Helpers.run(`echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`).sync();
    this._exit();
  }
  watchers() {
    Helpers.run(`find /proc/*/fd -user "$USER" -lname anon_inode:inotify -printf '%hinfo/%f\n' 2>/dev/null | xargs cat | grep -c '^inotify'`).sync();
    this._exit();
  }
  //#endregion

  //#region code instal ext
  code() {
    this.project.run(`code --install-extension ${this.args.join(' ')}`).sync();
    this._exit();
  }
  //#endregion

  //#region proper watcher test
  async PROPERWATCHERTEST(engine: string) {
    const proj = this.project as Project;
    const watchLocation = crossPlatformPath([proj.location, config.folder.src]);
    const symlinkCatalog = crossPlatformPath([proj.location, 'symlinkCatalog']);
    const symlinkCatalogInWatch = crossPlatformPath([watchLocation, 'symlink']);
    const symlinkCatalogFile = crossPlatformPath([proj.location, 'symlinkCatalog', 'dupa.txt']);
    const options: IncrementalWatcherOptions = {
      name: `[firedev]  properwatchtest (testing only)`,
      ignoreInitial: true,
    };

    Helpers.remove(symlinkCatalog);
    Helpers.writeFile(symlinkCatalogFile, 'hello dupa');
    Helpers.writeFile(crossPlatformPath([proj.location, config.folder.src, 'a1', 'aa']), 'asdasdasdhello dupa');
    Helpers.writeFile(crossPlatformPath([proj.location, config.folder.src, 'a2', 'ccc']), 'heasdasdllo asdasd');
    Helpers.createSymLink(symlinkCatalog, symlinkCatalogInWatch);

    (await incrementalWatcher(watchLocation, options)).on('all', (a, b) => {
      console.log('FIRSTA', a, b);
    });

    (await incrementalWatcher(watchLocation, options)).on('all', (a, b) => {
      console.log('SECOND', a, b);
    });

    (await incrementalWatcher(symlinkCatalog, options)).on('all', (a, b) => {
      console.log('THIRD', a, b);
    });

    console.log('await done');
  }
  //#endregion

  //#region add import src
  ADD_IMPORT_SRC() {
    const project = this.project as Project;


    const regexEnd = /from\s+(\'|\").+(\'|\")/g;
    const singleLineImporrt = /import\((\'|\"|\`).+(\'|\"|\`)\)/g;
    const singleLineRequire = /require\((\'|\"|\`).+(\'|\"|\`)\)/g;
    const srcEnd = /\/src(\'|\"|\`)/;
    const betweenApos = /(\'|\"|\`).+(\'|\"|\`)/g;

    const commentMultilieStart = /^\/\*/;
    const commentSingleLineStart = /^\/\//;

    const processAddSrcAtEnd = (regexEnd: RegExp, line: string, packages: string[], matchType: 'from_import_export' | 'imports' | 'require'): string => {
      const matches = line.match(regexEnd);
      const firstMatch = _.first(matches) as string;
      const importMatch = (_.first(firstMatch.match(betweenApos)) as string).replace(/(\'|\"|\`)/g, '');
      const isOrg = importMatch.startsWith('@');
      const packageName = importMatch.split('/').slice(0, isOrg ? 2 : 1).join('/');
      if (packages.includes(packageName) && !srcEnd.test(firstMatch)) {
        let clean: string;
        if (matchType === 'require' || matchType === 'imports') {
          const endCharacters = firstMatch.slice(-2);
          clean = firstMatch.slice(0, firstMatch.length - 2) + '/src' + endCharacters;
        } else {
          let endCharacters = firstMatch.slice(-1);
          clean = firstMatch.slice(0, firstMatch.length - 1) + '/src' + endCharacters;
        }

        return line.replace(firstMatch, clean);
      }
      return line;
    }

    const changeImport = (content: string, packages: string[]) => {
      return content.split(/\r?\n/).map((line, index) => {
        const trimedLine = line.trimStart();
        if (commentMultilieStart.test(trimedLine) || commentSingleLineStart.test(trimedLine)) {
          return line;
        }
        if (regexEnd.test(line)) {
          return processAddSrcAtEnd(regexEnd, line, packages, 'from_import_export');
        }
        if (singleLineImporrt.test(line)) {
          return processAddSrcAtEnd(singleLineImporrt, line, packages, 'imports');
        }
        if (singleLineRequire.test(line)) {
          return processAddSrcAtEnd(singleLineRequire, line, packages, 'require');
        }
        return line;
      }).join('\n') + '\n';
    };

    const addImportSrc = (proj: Project) => {
      PackagesRecognition.fromProject(proj).start(true, 'src adding process');
      const pacakges = [
        ...BrowserCodeCut.IsomorphicLibs,
        ...(proj.__isSmartContainerChild ? proj.parent.children.map(c => `@${proj.parent.name}/${c.name}`) : []),
      ];
      // console.log(pacakges)

      const files = Helpers.filesFrom(proj.pathFor('src'), true).filter(f => f.endsWith('.ts'));

      for (const file of files) {
        const originalContent = Helpers.readFile(file);
        const changed = changeImport(originalContent, pacakges);
        if (originalContent && changed && originalContent?.trim().replace(/\s/g, '') !== changed?.trim().replace(/\s/g, '')) {
          Helpers.writeFile(file, changed);
        }
      }
    };

    if (project.__isStandaloneProject) {
      addImportSrc(project);
    } else if (project.__isContainer) {
      for (const child of project.children) {
        addImportSrc(child);
      }
    }

    this._exit()
  }
  //#endregion

  //#region move js to ts
  $MOVE_JS_TO_TS(args) {
    Helpers
      .filesFrom(crossPlatformPath([this.cwd, args]), true)
      .forEach(f => {
        if (path.extname(f) === '.js') {
          Helpers.move(f, crossPlatformPath([path.dirname(f), path.basename(f).replace('.js', '.ts')]))
        }
      })
    Helpers.info('DONE')
    this._exit()
  }
  //#endregion

  //#region show messages
  ASYNC_PROC = async (args) => {
    global.tnpShowProgress = true;
    let p = Helpers.run(`${config.frameworkName} show:loop ${args}`, { output: false, cwd: this.cwd }).async()
    p.stdout.on('data', (chunk) => {
      console.log('prod:' + chunk)
    })
    p.on('exit', (c) => {
      console.log('process exited with code: ' + c)
      this._exit()
    })
  }


  SYNC_PROC = async (args) => {
    global.tnpShowProgress = true;
    try {
      let p = Helpers.run(`${config.frameworkName} show:loop ${args}`, { output: false, cwd: this.cwd }).sync()
      this._exit()
    } catch (err) {
      console.log('Erroroejk')
      this._exit(1)
    }
  }

  SHOW_RANDOM_HAMSTERS() {
    while (true) {
      const arr = ['Pluszla', 'Łapczuch', 'Misia', 'Chrupka']
      console.log(arr[Helpers.numbers.randomInteger(0, arr.length - 1)]);
      Helpers.sleep(1);
    }
  }

  SHOW_RANDOM_HAMSTERS_TYPES() {
    while (true) {
      const arr = [
        'djungarian',
        'syrian golden',
        'syrian teddy bear',
        'dwarf roborowski',
        'dwarf russian',
        'dwarf winter white',
        'chinese hamster'
      ]
      console.log(arr[Helpers.numbers.randomInteger(0, arr.length - 1)]);
      Helpers.sleep(1);
    }
  }

  SHOW_LOOP_MESSAGES(args) {
    global.tnpShowProgress = true;
    console.log('process pid', process.pid)
    console.log('process ppid', process.ppid)
    // process.on('SIGTERM', () => {
    //   this._exit()
    // })
    this._SHOW_LOOP_MESSAGES()
  }

  _SHOW_LOOP(c = 0 as any, maximum = Infinity, errExit = false) {
    if (_.isString(c)) {
      var { max = Infinity, err = false } = require('minimist')(c.split(' '));
      maximum = max;
      errExit = err;
      // console.log('max',max)
      // console.log('err',err)
      c = 0
    }
    if (c === maximum) {
      this._exit(errExit ? 1 : 0)
    }
    console.log(`counter: ${c}`)
    setTimeout(() => {
      this._SHOW_LOOP(++c, maximum, errExit)
    }, 1000);
  }

  _SHOW_LOOP_MESSAGES(c = 0 as any, maximum = Infinity, errExit = false, throwErr = false) {
    if (_.isString(c)) {
      const obj = require('minimist')(c.split(' '));
      var { max = Infinity, err = false } = obj;
      maximum = _.isNumber(max) ? max : Infinity;
      errExit = err;
      throwErr = obj.throw;
      // console.log('max',max)
      // console.log('err',err)
      c = 0
    }
    if (c === maximum) {
      if (throwErr) {
        throw new Error('Custom error!')
      }
      if (errExit) {
        this._exit(1)
      }
      this._exit()
    }
    console.log(`counter: ${c}`)
    PROGRESS_DATA.log({ msg: `counter: ${c}`, value: c * 7 })
    setTimeout(() => {
      this._SHOW_LOOP_MESSAGES(++c, maximum, errExit, throwErr)
    }, 2000)
  }
  //#endregion

  //#region ln
  LN() {
    const [source, dest] = this.args;
    Helpers.createSymLink(source, dest);
    this._exit();
  }
  //#endregion

  //#region link
  LINK() {
    let project = this.project;

    if (project.__isStandaloneProject) {
      // if (process.platform !== 'win32') {
      //   await Helpers.isElevated();
      // }
      //#region linking to global/local bin
      let glboalBinFolderPath = path.dirname(Helpers.run(`which ${config.frameworkName}`, { output: false }).sync().toString());
      if (process.platform === 'win32') {
        glboalBinFolderPath = crossPlatformPath(glboalBinFolderPath);
        if (/^\/[a-z]\//.test(glboalBinFolderPath)) {
          glboalBinFolderPath = glboalBinFolderPath.replace(/^\/[a-z]\//, `${glboalBinFolderPath.charAt(1).toUpperCase()}:/`);
        }
      }
      const globalNodeModules = crossPlatformPath(path.join(glboalBinFolderPath,
        (process.platform === 'win32') ? config.folder.node_modules : `../lib/${config.folder.node_modules}`));
      const packageInGlobalNodeModules = crossPlatformPath(path.resolve(path.join(globalNodeModules, project.name)));
      // packageInGlobalNodeModules
      Helpers.removeIfExists(packageInGlobalNodeModules);
      project.linkTo(packageInGlobalNodeModules);

      if (!Helpers.exists(project.pathFor(config.folder.bin))) {
        Helpers.mkdirp(project.pathFor(config.folder.bin));
      }

      const pattern = `${project.pathFor(config.folder.bin)}/*`;
      const countLinkInPackageJsonBin = glob
        .sync(pattern)
        .map(f => crossPlatformPath(f))
        .filter(f => {
          return (Helpers.readFile(f) || '').startsWith('#!/usr/bin/env');
        });

      if (countLinkInPackageJsonBin.length === 0) {
        const pathNormalLink = Helpers.path.create(project.location, config.folder.bin, `${project.name}`);
        Helpers.writeFile(pathNormalLink, this._templateBin());
        countLinkInPackageJsonBin.push(pathNormalLink);

        const pathDebugLink = Helpers.path.create(project.location, config.folder.bin, `${project.name}-debug`);
        Helpers.writeFile(pathDebugLink, this._templateBin(true));
        countLinkInPackageJsonBin.push(pathDebugLink);

        const startBackendFile = Helpers.path.create(
          project.location,
          config.folder.src,
          config.file.start_backend_ts
        );
        if (!Helpers.exists(startBackendFile)) {
          Helpers.writeFile(startBackendFile, this._templateStartBackedn());
        }

      }

      project.__packageJson.data.bin = {};
      countLinkInPackageJsonBin.forEach(p => {
        project.__packageJson.data.bin[path.basename(p)] = `bin/${path.basename(p)}`;
      });
      project.__packageJson.save(`update bin data`);

      if (_.isObject(project.__packageJson.data.bin)) {
        Object.keys(project.__packageJson.data.bin).forEach(globalName => {
          const localPath = path.join(project.location, project.__packageJson.data.bin[globalName]);
          const destinationGlobalLink = path.join(glboalBinFolderPath, globalName);
          Helpers.removeIfExists(destinationGlobalLink);

          const inspect = globalName.endsWith('debug') || globalName.endsWith('inspect');
          const inspectBrk = globalName.endsWith('debug-brk') || globalName.endsWith('inspect-brk');
          const attachDebugParam = inspect ? '--inspect' : (inspectBrk ? '--inspect-brk' : '')

          if (process.platform === 'win32') {
            Helpers.writeFile(destinationGlobalLink, `
  #!/bin/sh
  basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

  case \`uname\` in
      *CYGWIN*|*MINGW*|*MSYS*) basedir=\`cygpath -w "$basedir"\`;;
  esac

  if [ -x "$basedir/node" ]; then
    "$basedir/node" ${attachDebugParam} "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" "$@"
    ret=$?
  else
    node ${attachDebugParam} "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" "$@"
    ret=$?
  fi
  exit $ret
            `.trim() + '\n');


            const destinationGlobalLinkPS1File = path.join(glboalBinFolderPath, `${globalName}.ps1`);
            Helpers.writeFile(destinationGlobalLinkPS1File, `
  #!/usr/bin/env pwsh
  $basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

  $exe=""
  if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
    # Fix case when both the Windows and Linux builds of Node
    # are installed in the same directory
    $exe=".exe"
  }
  $ret=0
  if (Test-Path "$basedir/node$exe") {
    & "$basedir/node$exe"  "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" $args
    $ret=$LASTEXITCODE
  } else {
    & "node$exe"  "$basedir/node_modules/${path.basename(project.location)}/bin/${globalName}" $args
    $ret=$LASTEXITCODE
  }
  exit $ret
            `.trim() + '\n');
            const destinationGlobalLinkCmdFile = path.join(glboalBinFolderPath, `${globalName}.cmd`);
            Helpers.writeFile(destinationGlobalLinkCmdFile, `
  @ECHO off
  SETLOCAL
  CALL :find_dp0

  IF EXIST "%dp0%\\node.exe" (
    SET "_prog=%dp0%\\node.exe"
  ) ELSE (
    SET "_prog=node"
    SET PATHEXT=%PATHEXT:;.JS;=;%
  )

  "%_prog%"  "%dp0%\\node_modules\\${path.basename(project.location)}\\bin\\${globalName}" %*
  ENDLOCAL
  EXIT /b %errorlevel%
  :find_dp0
  SET dp0=%~dp0
  EXIT /b

            `.trim() + '\n');

          } else {
            Helpers.createSymLink(localPath, destinationGlobalLink);
            const command = `chmod +x ${destinationGlobalLink}`;
            Helpers.log(`Trying to make file exacutable global command "${chalk.bold(globalName)}".

            command: ${command}
            `)
            Helpers.run(command).sync();
          }

          Helpers.info(`Global link created for: ${chalk.bold(globalName)}`);
        });
      }

      this._exit();
      //#endregion
    }
    Helpers.info(`Linking DONE!`)
    this._exit()
  }

  _templateBin(debug = false) {
    return `#!/usr/bin/env node ${debug ? '--inspect' : ''}
  var { fse, crossPlatformPath, path } = require('tnp-core/src');
  var path = {
    dist: path.join(crossPlatformPath(__dirname), '../dist/index.js'),
    npm: path.join(crossPlatformPath(__dirname), '../index.js')
  }
  var p = fse.existsSync(path.dist) ? path.dist : path.npm;
  global.globalSystemToolMode = true;
  var run = require(p).run;
  run(process.argv.slice(2));
    `
  }

  _templateStartBackedn() {
    return `import { Helpers } from 'tnp-helpers/src';

  export async function run([]) {
    console.log('Hello from', require('path').basename(process.argv[1]))
    const command = args.shift() as any;
    if (command === 'test') {
      Helpers.clearConsole();
      console.log('waiting for nothing...')
      process.stdin.resume();
    }
    this._exit();
    }`
  }
  //#endregion

  //#region dedupe
  DEDUPE() {
    this.project.__node_modules.dedupe(this.args.join(' ').trim() === '' ? void 0 : this.args)
    this._exit()
  }

  DEDUPE_COUNT() {
    this.project.__node_modules.dedupeCount(this.args.join(' ').trim() === '' ? void 0 : this.args)
    this._exit()
  }
  //#endregion

  //#region deps

  DEPS_SHOW() {
    this.project.__packageJson.showDeps('deps show')
    this._exit()
  }

  DEPS_HIDE() {
    if (this.project.__isCoreProject) {
      this.project.__packageJson.showDeps('deps show')
    } else {
      this.project.__packageJson.hideDeps('deps hide')
    }
    this._exit()
  }

  DEPS_UPDATE_FROM() {
    let locations: string[] = (this.args.join(' ').trim() === '' ? [] : this.args);

    if (_.isArray(locations)) {
      locations = locations
        .map(l => {
          if (path.isAbsolute(l)) {
            return path.resolve(l);
          }
          return path.resolve(path.join(this.cwd, l));
        });
    }
    this.project.__packageJson.updateFrom(locations);


    this._exit();
  }

  /**
   * generate deps json
   */
  DEPS_JSON() {
    const node_moduels = path.join(this.cwd, config.folder.node_modules);
    const result = {};
    Helpers
      .foldersFrom(node_moduels)
      .filter(f => path.basename(f) !== '.bin')
      .forEach(f => {
        const packageName = path.basename(f);
        if (packageName.startsWith('@')) {
          const orgName = packageName;
          Helpers.foldersFrom(f).forEach(f2 => {
            try {
              result[`${orgName}/${path.basename(f2)}`] = Helpers.readValueFromJson(path.join(f2, config.file.package_json), 'version', '');
            } catch (error) { }
          });
        } else {
          try {
            result[packageName] = Helpers.readValueFromJson(path.join(f, config.file.package_json), 'version', '');
          } catch (error) { }
        }

      });
    Helpers.writeJson(path.join(this.cwd, config.file.result_packages_json), result);
    this._exit();
  }
  //#endregion

  //#region reinstall
  async REINSTALL() {
    // await Helpers.killAllNodeExceptCurrentProcess();
    const proj = this.project;

    if (proj.__isContainer) {
      if (proj.__isContainerCoreProject) {
        proj.__node_modules.remove();
        proj.__smartNodeModules.remove();
        proj.__npmPackages.installFromArgs('');
        Helpers.info(`Reinstal done for core container`);
      } else {
        // smart container or normal container
        const children = proj.children.filter(c => c.__frameworkVersionAtLeast('v3') && c.typeIs('isomorphic-lib') && c.__npmPackages.useSmartInstall);
        for (let index = 0; index < children.length; index++) {
          const c = children[index];
          Helpers.info(`Recreating node_module for ${c.genericName}`)
          c.__node_modules.remove();
          c.__smartNodeModules.remove();
          await c.__filesStructure.initFileStructure();
        }
      }
    } else if (proj.__isStandaloneProject && proj.__npmPackages.useSmartInstall) {
      proj.__node_modules.remove();
      proj.__smartNodeModules.remove();
      proj.__npmPackages.installFromArgs('')
      Helpers.info(`Reinstal done for core standalone project`);
    } else {
      Helpers.error(`[${config.frameworkName}] This project does not support reinsall.
    location: ${proj?.location}
    `, false, false);
    }

    this._exit();
  };
  //#endregion

  //#region circural deps check
  CIRCURAL_CHECK() {
    this.project.run(`npm-run madge --circular --extensions ts ./src`).sync()
    this._exit()
  }
  //#endregion

  //#region file info
  FILEINFO = (args) => {
    console.log(Helpers.getMostRecentFilesNames(crossPlatformPath(this.cwd)))

    this._exit()
  }
  //#endregion

  //#region versions
  VERSIONS() {
    const children = this.project.children;

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Project;
      Helpers.info(`v${child.__packageJson.data.version}\t - ${child.genericName}`);
    }

    this._exit()
  }
  //#endregion

  //#region path
  PATH = () => {
    console.log((Project.ins.Tnp).location);
    this._exit()
  };
  //#endregion

  //#region env
  ENV_CHECK(args) {
    Helpers.checkEnvironment()
    this._exit()
  };

  ENV_INSTALL() {
    CLI.installEnvironment(config.required);
    this._exit()
  }
  //#endregion

  //#region throw error
  THROW_ERR() {
    Helpers.error(`Erororoororo here`, false, true);
  }
  //#endregion

  //#region mp3
  /**
   *  npm install --global bin-version-check-cli
   *  npm i -g yt-dlp
   *  choco install ffmpeg
   */
  MP3(args) {
    const downloadPath = crossPlatformPath(path.join(os.userInfo().homedir, 'Downloads', 'mp3-from-youtube'));
    if (!Helpers.exists(downloadPath)) {
      Helpers.mkdirp(downloadPath)
    }

    Helpers.run(`cd ${downloadPath} && yt-dlp --verbose --extract-audio --audio-format mp3 ` + args,
      {
        output: true,
        cwd: downloadPath
      }).sync();
    this._exit()
  }
  //#endregion

  //#region mp4
  MP4(args) {
    // yt-dlp --print filename -o "%(uploader)s-%(upload_date)s-%(title)s.%(ext)s"
    Helpers.run('yt-dlp --verbose  -S "res:1080,fps" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ' + args,
      {
        output: true,
        cwd: crossPlatformPath(path.join(os.userInfo().homedir, 'Downloads'))
      }).sync();
    this._exit()
  }
  //#endregion

  //#region brew
  BREW(args) {
    const isM1MacOS = os.cpus()[0].model.includes('Apple M1');
    if (process.platform === 'darwin') {
      if (isM1MacOS) {
        Helpers.run(`arch -x86_64 brew ${args}`).sync();
      } else {
        Helpers.run(`brew ${args}`).sync();
      }
    }
    this._exit();
  }
  //#endregion

  //#region version
  async version() {
    Helpers.log(`Framework name: ${config.frameworkName}`)
    //#region @notForNpm
    if (ENV.notForNpm) {
      Helpers.success(`I am secret project!!!`);
    }
    //#endregion
    // global.spinner?.start();
    // Helpers.sleep(1);
    // Helpers.info(`${config.frameworkName} location: ${Project.ins.Tnp.location}`)
    // Helpers.sleep(1);
    // Helpers.info(`${config.frameworkName} location: ${Project.ins.Tnp.location}`)
    // Helpers.sleep(1);
    // Helpers.info(`${config.frameworkName} location: ${Project.ins.Tnp.location}`)
    // Helpers.sleep(1);
    // Helpers.info(`${config.frameworkName} location: ${Project.ins.Tnp.location}`)
    // Helpers.sleep(1);
    // Helpers.info(`${config.frameworkName} location: ${Project.ins.Tnp.location}`)
    // Helpers.info('waiting...');

    // global.spinner?.start();
    // Helpers.info('waiting next time!!. ..');
    // Helpers.sleep(5);
    // global.spinner?.stop();
    // log.data('Hellleoeoeo')
    const tnp = (Project.ins.Tnp);
    const firedev = Project.ins.From([fse.realpathSync(path.dirname(tnp.location)), config.frameworkNames.firedev]);
    Helpers.success(`

  Firedev: ${firedev?.version ? `v${firedev.version}` : '-'}
  Tnp: ${tnp?.version ? `v${tnp.version}` : '-'}

    `);
    this._exit()
  }
  //#endregion

  //#region ps info
  async PSINFO(args: string) {
    const pid = Number(args)

    let ps: Models.PsListInfo[] = await psList()

    let psinfo = ps.find(p => p.pid == pid);
    if (!psinfo) {
      Helpers.error(`No process found with pid: ${args}`, false, true)
    }
    console.log(psinfo)
  }
  //#endregion

  //#region init core porjects
  async INIT_CORE() {
    Helpers.taskStarted(`${config.frameworkName} initing core projects`);
    let allCoreProject: (Project & {
      projectLinkedFiles: any; // TODO QUICKFIX,
      filesStructure: any;
    })[] = [];

    (config.coreProjectVersions as CoreModels.FrameworkVersion[]).forEach(v => {
      let corePorjectsTypes: CoreModels.LibType[] = ['isomorphic-lib'];
      const projects = corePorjectsTypes.map(t => Project.by(t, v));
      allCoreProject = [
        ...projects,
        ...allCoreProject,
      ] as any;
    });

    for (let index = 0; index < allCoreProject.length; index++) {
      const projectToInit = allCoreProject[index] as Project;
      Helpers.log(`${projectToInit.genericName} ${projectToInit.location}`);
      const linkedFiles = projectToInit.__projectLinkedFiles();
      for (let index2 = 0; index2 < linkedFiles.length; index2++) {
        const l = linkedFiles[index2];
        const source = path.join(l.sourceProject.location, l.relativePath);
        const dest = path.join(projectToInit.location, l.relativePath);
        if (!Helpers.exists(source)) {
          Helpers.error(`[${config.frameworkName}] Core source do not exists: ${source}`, false, true);
        }
        Helpers.log(`${config.frameworkName} link from: ${source} to ${dest}`);
        // Helpers.remove(dest)
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
      }
      await projectToInit.struct();
    }
    Helpers.taskDone('DONE');
    this._exit()
  }
  //#endregion

  //#region sync core repositories
  async SYNC() {
    Project.sync();
    this._exit();
  }
  //#endregion

  //#region autoupdate
  async autoupdate() {
    if (config.frameworkName === 'firedev') {
      Helpers.run('npm i -g firedev', { output: true }).sync();
      if (await Helpers.questionYesNo(`Proceed with ${config.frameworkName} auto-update ?`)) {
        Project.sync();
      }
    }
    if (config.frameworkName === 'tnp') {
      Helpers.taskStarted('Removing old node_modules..');
      const nm = (Project.ins.Tnp).__node_modules.path;
      const nm2 = (Project.ins.Tnp).pathFor(`tmp-${config.folder.node_modules}2`)
      const nm1 = (Project.ins.Tnp).pathFor(`tmp-${config.folder.node_modules}1`)

      if (process.platform !== 'win32') {
        Helpers.removeIfExists(nm2);
        if (Helpers.exists(nm1)) {
          Helpers.move(nm1, nm2);
        }
        Helpers.removeIfExists(nm1);
        if (Helpers.exists(nm)) {
          Helpers.move(nm, nm1);
        }
      }
      Helpers.taskDone();

      Helpers.taskStarted(`Installing new version of ${config.frameworkName} pacakges`)
      Project.ins.Tnp.run(`npm i --force && npm-run tsc && ${config.frameworkName} dedupe`).sync();
      Helpers.taskDone();


      const arrActive = config.activeFramewrokVersions;
      for (let index = 0; index < arrActive.length; index++) {
        const defaultFrameworkVersionForSpecyficContainer = arrActive[index];
        Helpers.taskStarted(`Installing new versions smart container ${defaultFrameworkVersionForSpecyficContainer} pacakges`)
        const container = Project.by('container', defaultFrameworkVersionForSpecyficContainer);
        container.run(`${config.frameworkName}  reinstall`).sync();

        Helpers.taskDone();
      }
      Helpers.success(`${config.frameworkName.toUpperCase()} AUTOUPDATE DONE`);
    }
    // const file = path.basename(args.trim());
    // function processing() {
    //   Helpers.info(`processing file...`);
    // }
    // switch (file) {
    //   case config.file.tmpIsomorphicPackagesJson:
    //     processing();
    //     PackagesRecognition.fromProject(this.project).start(true, '[update process]');
    //     break;
    //   default:
    //     Helpers.error(`Not recognized file for update`, false, true);
    //     break;
    // }
    Helpers.info(`${config.frameworkName} - AUTOUPDATE  DONE`);
    this._exit();
  }
  //#endregion

  //#region copy and rename (vscode option)
  async $COPY_AND_RENAME(args: string) {
    // console.log(`>> ${args} <<`)
    const ins = MagicRenamer.Instance(this.cwd);
    await ins.start(args, true);
    this._exit();
  }
  //#endregion

  //#region generate
  GENERATE(args: string) {
    const argsv = args.split(' ');
    let [absPath, moduleName, entityName] = argsv;
    if (!Helpers.exists(absPath)) {
      Helpers.mkdirp(absPath);
    }
    const absFilePath = crossPlatformPath(absPath);
    if (!Helpers.isFolder(absPath)) {
      absPath = crossPlatformPath(path.dirname(absPath));
    }
    entityName = decodeURIComponent(entityName);
    const nearestProj = Project.ins.nearestTo(this.cwd) as Project;
    // console.log({
    //   nearestProj: nearestProj?.location
    // })
    let container = Project.by('container', nearestProj.__frameworkVersion) as Project;
    if (container.__frameworkVersionLessThan('v3')) {
      container = Project.by('container', config.defaultFrameworkVersion) as Project;
    }

    const myEntity = 'my-entity';

    const flags = {
      flat: '_flat',
      custom: '_custom',
    }

    const isFlat = moduleName.includes(flags.flat);
    moduleName = moduleName.replace(flags.flat, '');

    const isCustom = moduleName.includes(flags.custom);
    moduleName = moduleName.replace(flags.custom, '');

    const exampleLocation = crossPlatformPath([container.location, 'gen-examples', moduleName, myEntity]);


    const newEntityName = _.kebabCase(entityName);
    const generatedCodeAbsLoc = crossPlatformPath([container.location, 'gen-examples', moduleName, newEntityName]);
    Helpers.remove(generatedCodeAbsLoc, true);
    let destination = crossPlatformPath([absPath, newEntityName]);
    if (isFlat) {
      destination = crossPlatformPath(path.dirname(destination));
    }

    if (isCustom) {
      //#region handle custom cases
      if (moduleName === 'generated-index-exports') {

        const folders = [
          ...Helpers.foldersFrom(absPath).map(f => path.basename(f)),
          ...Helpers.filesFrom(absPath, false).map(f => path.basename(f)),
        ]
          .filter(f => !['index.ts'].includes(f))
          .filter(f => !f.startsWith('.'))
          .filter(f => !f.startsWith('_'))
          .filter(f => _.isUndefined(notNeededForExportFiles.find(e => f.endsWith(e))))
          .filter(f => (path.extname(f) === '') || !_.isUndefined(extAllowedToExportAndReplaceTSJSCodeFiles.find(a => f.endsWith(a))))
          ;
        Helpers.writeFile(
          crossPlatformPath([absPath, config.file.index_ts]),
          folders.map(f => {
            if (!_.isUndefined(frontendFiles.find(bigExt => f.endsWith(bigExt)))) {
              `${TAGS.COMMENT_REGION} ${TAGS.BROWSER}\n`
                + `export * from './${f.replace(path.extname(f), '')}';`
                + + `\n${TAGS.COMMENT_END_REGION}\n`
            }
            if (!_.isUndefined(backendNodejsOnlyFiles.find(bigExt => f.endsWith(bigExt)))) {
              return `${TAGS.COMMENT_REGION} ${TAGS.BACKEND}\n`
                + `export * from './${f.replace(path.extname(f), '')}';`
                + + `\n${TAGS.COMMENT_END_REGION}\n`
            }
            return `export * from './${f.replace(path.extname(f), '')}';`
          }).join('\n') + '\n'
        );
      }
      if (moduleName === 'wrap-with-browser-regions') {
        if (!Helpers.isFolder(absFilePath)) {
          const content = Helpers.readFile(absFilePath);
          Helpers.writeFile(absFilePath,
            `${TAGS.COMMENT_REGION} ${TAGS.BROWSER}\n`
            + content
            + `\n${TAGS.COMMENT_END_REGION}\n`
          );
        }
      }
      //#endregion
    } else {
      const ins = MagicRenamer.Instance(exampleLocation);
      ins.start(`${myEntity} -> ${newEntityName}`, true);
      if (isFlat) {
        const files = Helpers.filesFrom(generatedCodeAbsLoc, true);
        for (let index = 0; index < files.length; index++) {
          const fileAbsPath = crossPlatformPath(files[index]);
          const relative = fileAbsPath.replace(generatedCodeAbsLoc + '/', '');
          const destFileAbsPath = crossPlatformPath([destination, relative]);
          Helpers.copyFile(fileAbsPath, destFileAbsPath);
        }
        Helpers.remove(generatedCodeAbsLoc, true)
      } else {
        Helpers.move(generatedCodeAbsLoc, destination);
      }
    }
    console.info('GENERATION DONE')
    this._exit(0)
  }
  //#endregion

  //#region update
  async UPDATE() {
    const cwd = crossPlatformPath(this.cwd);

    const proj = Project.ins.From(cwd) as Project;

    if (proj.__isContainer) {

      const linkedProjects = Helpers.foldersFrom(cwd)
        .map(f => path.basename(f))
        .filter(f => !f.startsWith('.'))
        .filter(f => Helpers.checkIfNameAllowedForFiredevProj(f))
        .filter(f => !!Project.ins.From([cwd, f]))
        ;

      if (Helpers.exists([cwd, config.file.package_json__tnp_json5]) && Helpers.exists([cwd, config.file.package_json__tnp_json])) {
        Helpers.remove([cwd, config.file.package_json__tnp_json]);
      }

      if (Helpers.exists([cwd, config.file.package_json__tnp_json5])) {
        Helpers.remove([cwd, config.file.package_json__tnp_json]);
      }

      const orgPj = Helpers.readJson([cwd, config.file.package_json]) as Models.IPackageJSON;

      const endAction = () => {
        const gitIgnore = `

      ${linkedProjects.map(l => `/${l}`).join('\n')}

        `;
        Helpers.writeFile([cwd, config.file._gitignore], gitIgnore);



        if (!Helpers.git.isGitRoot(cwd)) {
          Helpers.run('git init', { cwd }).sync()
        }

        Helpers.run(`${config.frameworkName} init`, { cwd }).sync();
      }

      if (orgPj?.tnp) {
        if (await Helpers.questionYesNo(`

      Deteced project:
  ${linkedProjects.map(l => `- ${l}`).join('\n')}


  Would you like to update current project configuration?`)) {
          const pf = {
            name: path.basename(cwd),
            version: orgPj.version,
            [config.frameworkNames.tnp]: orgPj.tnp,
          };
          const tnp = (pf[config.frameworkNames.tnp] as Models.TnpData);
          tnp.type = 'container';
          tnp.version = proj.__frameworkVersion;
          tnp.linkedProjects = linkedProjects;
          Helpers.writeFile([cwd, config.file.package_json], pf);
          Helpers.remove([cwd, config.file.package_json__tnp_json]);
          Helpers.remove([cwd, config.file.package_json__tnp_json5]);
          endAction();
        }
      } else {
        const pf = {
          name: path.basename(cwd),
          version: "0.0.0",
          [config.frameworkNames.tnp]: {
            version: proj.__frameworkVersion,
            type: 'container',
            linkedProjects,
          } as Models.TnpData,
        };
        Helpers.writeFile([cwd, config.file.package_json], pf);
        endAction();
      }

      Helpers.info('Done');
    }

    this._exit(0)
  }
  //#endregion

  //#region clear
  async CLEAN() {
    await this.project.clear();
    this._exit();
  }

  CLEAR() {
    this.CLEAN()
  }

  CL() {
    this.CLEAN()
  }
  //#endregion

  //#region show git in progress
  inprogress() {
    Helpers.info(`
    In progress
${this.project.children
        .filter(f => f.git.lastCommitMessage().startsWith(Helpers.git.ACTION_MSG_RESET_GIT_HARD_COMMIT))
        .map((c, index) => `${index + 1}. ${c.genericName}`)
      }

    `);
    this._exit()
  }
  //#endregion
}


export default { // registerd as empty
  $Global: Helpers.CLIWRAP($Global, ''),
}
