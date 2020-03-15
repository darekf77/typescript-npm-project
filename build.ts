import * as child from 'child_process';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as _ from 'lodash';

type ProjName = 'tnp' | 'tnp-models' | 'tnp-db' | 'tnp-helpers';
type ProjObj = { name: ProjName; deps?: ProjName[]; notify?: ProjName[]; };

const projectSpecyfication: ProjObj[] = [
  { name: 'tnp-models' },
  { name: 'tnp-helpers' },
  { name: 'tnp-db' },
  { name: 'tnp' },
];

const encoding = 'utf8';

process.argv = process.argv.map(c => {
  if (c === '-verbose') {
    return `-${c}`;
  }
  return c;
});
let { verbose = false } = require('minimist')(process.argv);
console.log(`Verbose: ${verbose ? 'TRUE' : 'FALASE'}`);

//#region procedure
function getLocation(projectName: ProjName): string {
  if (projectName === 'tnp') {
    return process.cwd();
  }
  return path.resolve(path.join(process.cwd(), '..', projectName));
}

function runSync(command: string, cwd: string) {
  const res = child.execSync(command, { stdio: [0, 1, 2], cwd, maxBuffer: 2024 * 500 })
  res && console.log(res);
}

function modifyLineByLine(data: string | Buffer | Error, outputLineReplace: (outputLine: string) => string) {
  let modifyOutput = _.isFunction(outputLineReplace);
  if (modifyOutput && _.isString(data)) {
    data = data.split(/\r?\n/).map(line => outputLineReplace(line)).join('\n');
  }
  return data as string;
}


function runAsync(command: string, cwd: string, outputLineReplace?: (outputLine: string) => string) {
  const proc = child.exec(command, { cwd, maxBuffer: 2024 * 500 });

  proc.stdout.on('data', (data) => {
    process.stdout.write(modifyLineByLine(data, outputLineReplace))
  })

  proc.stdout.on('error', (data) => {
    console.log(modifyLineByLine(data, outputLineReplace));
  })

  proc.stderr.on('data', (data) => {
    process.stderr.write(modifyLineByLine(data, outputLineReplace))
  })

  proc.stderr.on('error', (data) => {
    console.log(modifyLineByLine(data, outputLineReplace));
  })
}

function compileProjectsSync(name: ProjName) {
  console.log(`Compiling project: ${chalk.bold(name)}...`);
  const cwd = getLocation(name);
  try {
    runSync(`rm -rf dist && tsc`, cwd);
  } catch (error) {
    process.exit(0)
  }
  console.log(`Compiling done for ${chalk.bold(name)}`);
}

projectSpecyfication.forEach((c, i) => {
  c.deps = projectSpecyfication.slice(0, i).map(a => a.name);
  c.notify = projectSpecyfication.slice(i, projectSpecyfication.length)
    .filter(a => c.name !== a.name)
    .map(a => a.name)
});

// console.log(projectSpecyfication)
// process.exit(0)

if (process.argv[2] !== '-w') {


  for (let index = 0; index < projectSpecyfication.length; index++) {
    const proj = projectSpecyfication[index];
    if (proj.deps && proj.deps.length > 0) {
      for (let indexDep = 0; indexDep < proj.deps.length; indexDep++) {
        const dependency = proj.deps[indexDep];
        const dependencyDist = path.join(getLocation(dependency), 'dist');
        const currentNodeModules = path.join(getLocation(proj.name as any), 'node_modules', dependency);
        rimraf.sync(currentNodeModules);
        console.log(`Copying dependency ${chalk.bold(dependency)} to ${proj.name}/node_modules`);
        fse.copySync(dependencyDist, currentNodeModules, {
          recursive: true, overwrite: true
        });
      }
    }
    compileProjectsSync(proj.name);
  };

} else {
  console.log(`Ommiting sync compilation...`)
}


function syncFileInDirs(sourceDir: string, destDir: string, relativePath: string, targetProjNam: ProjName) {



  const source = path.join(sourceDir, relativePath);
  const dest = path.join(destDir, relativePath);

  // console.log(`
  // source: ${source}
  // dest: ${dest}

  //   `)
  if (!fse.existsSync(source)) {
    rimraf.sync(dest);
    verbose && console.log(`Removing destination: ${source}`)
    return;
  }
  if (fse.existsSync(source) && fse.lstatSync(source).isDirectory()) {
    verbose && console.log(`Source is directoru: ${source}`)
    return;
  }
  if (fse.existsSync(dest)) {
    const destFile = fse.readFileSync(dest, { encoding })
    const sourceFile = fse.readFileSync(source, { encoding })
    if ((destFile && sourceFile) && destFile.toString() === sourceFile.toString()) {
      verbose && console.log(`Destination is the same: ${dest}`)
      return;
    }
  }

  if (!fse.existsSync(path.dirname(dest))) {
    fse.mkdirpSync(path.dirname(dest))
  }
  fse.copyFileSync(source, dest);
  console.log(`Synced ${relativePath} in ${chalk.bold(targetProjNam)}`);
}

const fileExtToSync = [
  '.js', '.d.ts', '.js.map'
];

function syncChangesFor(file: string, proj: ProjObj, eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir') {
  const relativePath = file.replace(getLocation(proj.name), '').replace(/^\//, '').replace('src/', '')
  verbose && console.log(`Syncing changes from ${chalk.bold(proj.name)}, file ${relativePath}`);
  if (eventName === 'unlinkDir') {
    rimraf.sync(path.join(getLocation(proj.name), 'dist', relativePath));
  }
  if (proj.notify && proj.notify.length > 0) {
    for (let indexDep = 0; indexDep < proj.notify.length; indexDep++) {
      const dependencyToNotify = proj.notify[indexDep];
      if (eventName === 'unlinkDir') {
        rimraf.sync(path.join(getLocation(dependencyToNotify), 'dist', relativePath))
      } else {
        // console.log(dependencyToNotify)
        fileExtToSync.forEach(ext => {
          const relativePathChangd = relativePath.replace(path.extname(relativePath), ext);
          syncFileInDirs(
            path.join(getLocation(proj.name), 'dist'),
            path.join(getLocation(dependencyToNotify), 'node_modules', proj.name),
            relativePathChangd,
            dependencyToNotify
          );
        })
      }
    }
  }

}


function starWatching(proj: ProjObj, outputLineReplace?: (outputLine: string) => string) {
  console.log(`Starting watch for ${chalk.bold(proj.name)}...`);
  runAsync(`tsc -w --preserveWatchOutput`, getLocation(proj.name), outputLineReplace);
}

const last = _.last(projectSpecyfication);

// Watching
for (let index = 0; index < projectSpecyfication.length - 1; index++) {
  const proj = projectSpecyfication[index];
  const patternToWatch = `${path.join(getLocation(proj.name), 'src')}/**/*.*`;
  starWatching(proj, (output) => {
    if (!_.isString(output)) {
      return output;
    }
    return output.replace(`src/`, `${getLocation(proj.name)}/src/`);
  });

  const debounceTree = {};

  chokidar
    .watch(patternToWatch, {
      ignoreInitial: true,
    })
    .on('all', (e, filePath) => {
      verbose && console.log(`event: ${chalk.bold(e)} for ${filePath}`)
      const procedure = (f) => {
        if (!debounceTree[f]) {
          const debounceTime = 1000;
          debounceTree[f] = _.debounce(() => {
            verbose && console.log(`Debounce of ${f} after ${debounceTime}`);
            syncChangesFor(f, proj, e);
          }, debounceTime);
        } else {
          verbose && console.log(`Bouncing: ${f}`)
          debounceTree[f]();
        }
      }

      if (e === 'unlinkDir') {
        syncChangesFor(filePath, proj, e);
      } else {
        procedure(filePath);
      }

    });
}
starWatching(last);


//#endregion
