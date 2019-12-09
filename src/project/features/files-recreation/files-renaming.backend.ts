import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as sharp from 'sharp';
import { png2svg } from 'svg-png-converter';
import { Helpers } from '../../../helpers';
import index from 'chalk';

export class RenameRule {
  public from: string;
  public to: string;
  org = {
    from: void 0 as string,
    to: void 0 as string,
  }

  constructor(
    from: string,
    to: string,

  ) {
    this.org.from = from;
    this.org.to = to;
    this.from = from.toLowerCase().replace(/\W/g, ' ')
    this.to = to.toLowerCase().replace(/\W/g, ' ')
  }

  applyTo(s: string): boolean {
    s = s.trim().toLowerCase().replace(/\W/g, ' ')
    return (s.search(this.from) !== -1);
  }

  private findIndexes(s: string) {
    const indexes = [];
    let stmp = s.trim().toLowerCase().replace(/\W/g, ' ');
    const thisFrom = this.from;
    while (true) {
      const startIndex = stmp.search(thisFrom);
      if (startIndex === -1) {
        break;
      }
      if (!indexes.includes(startIndex)) {
        indexes.push(startIndex);
      }
      if (startIndex + thisFrom.length > stmp.length - 1) {
        break;
      }
      stmp = stmp.substr(startIndex + thisFrom.length);

    }
    return indexes;
  }

  private replaceFromIndex(orgString: string, startIndex: number) {
    if (startIndex === -1) {
      return;
    }

    const thisTo = this.to;
    const thisFrom = this.from;

    [
      [_.kebabCase(thisFrom), _.kebabCase(thisTo)],
      [_.camelCase(thisFrom), _.camelCase(thisTo)],
      [_.upperFirst(_.camelCase(thisFrom)), _.upperFirst(_.camelCase(thisTo))],
      [_.snakeCase(thisFrom), _.snakeCase(thisTo)],
      [_.startCase(thisFrom), _.startCase(thisTo)],
      [_.upperCase(thisFrom), _.upperCase(thisTo)],
      [_.lowerCase(thisFrom), _.lowerCase(thisTo)],
    ].forEach((v) => {
      const [from, to] = v;
      orgString = orgString.replace(new RegExp(Helpers.escapeStringForRegEx(from), 'g'), to);
    });

    return orgString;
  }

  mapFileContent(s: string): string {
    this.findIndexes(s).forEach(i => {
      s = this.replaceFromIndex(s, i);
    });
    return s;
  }

  mapFileName(s: string): string {
    let stmp = s.trim().toLowerCase().replace(/\W/g, ' ')
    let startIndex = stmp.search(this.from);
    if (startIndex === -1) {
      stmp = s.trim().toLowerCase().replace(/\W/g, '')
      startIndex = stmp.search(this.from.replace(/\W/g, ''));
    }
    return this.replaceFromIndex(s, startIndex);
  }

}

export class FilesRenaming {

  static start(aa: string) {
    new FilesRenaming(aa);
  }


  rules: RenameRule[] = [];

  private argString: string;
  constructor(
    argString: string
  ) {
    Helpers.info('Rebranding of files');

    const relativePath = argString.split(' ')[0];
    this.argString = argString.replace(relativePath, '');
    argString = this.argString;

    let args = this.argString.split(' ') as string[];
    Helpers.log('Rules');
    args.forEach(a => {
      Helpers.log(a)
    })
    this.rules = args
      .filter(a => a.search('->') !== -1)
      .map(a => {
        const [from, to] = a.split('->')
        if (!from || !to) {
          Helpers.error(`Incorrect rule
        "${from}" -> "${to}"
        please follow pattern: 'test name -> my new name '`, false, true);
        }
        return new RenameRule(from.trim(), to.trim());
      });

    // console.log(this.rules);
    // process.exit(0)

    let folder = path.join(process.cwd(), relativePath);
    // Helpers.info(folder)
    let files = getAllFilesFoldersRecusively(folder);
    // Helpers.info(`files:\n ${files.map(f => f.replace(folder, '')).join('\n')}`);
    const starCallback = newFolder => {
      if (newFolder) {
        folder = newFolder;
      }
      files = getAllFilesFoldersRecusively(folder);
      this.changeFiles(files, starCallback);
    };
    this.changeFiles(files, starCallback);
    files = getAllFilesFoldersRecusively(folder, true);
    this.changeContent(files)
  }

  changeFiles(files: string[] = [], startProcessAgain: (newFolder: string) => any, isFirstCall = true) {
    if (files.length === 0) {
      return;
    }
    const file = files.shift();
    Helpers.log(`Processing file: ${path.basename(file)}`)
    const fileName = path.basename(file);
    for (let index = 0; index < this.rules.length; index++) {
      const r = this.rules[index];
      // Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileName)) {
        // Helpers.log(`Apply to: ${fileName}`);
        const dest = path.join(path.dirname(file), r.mapFileName(fileName));
        Helpers.log(`dest: ${dest}`);
        Helpers.move(file, dest);
        if (path.extname(dest) === '') {
          Helpers.info(`Starting process again from: ${dest}`)
          startProcessAgain(isFirstCall ? dest : void 0);
          return false;
        }
      } else {
        // Helpers.log(`Not apply to: ${fileName}`);
      }
    }
    if (!this.changeFiles(files, startProcessAgain, false)) {
      return false;
    }
    return true;
  }

  changeContent(files: string[] = []) {
    if (files.length === 0) {
      return;
    }
    const file = files.shift();
    Helpers.log(`Processing file: ${path.basename(file)}`)
    const fileContent = Helpers.readFile(file);
    this.rules.forEach(r => {
      // Helpers.log(`Checking rule ${r}`)
      if (r.applyTo(fileContent)) {
        // Helpers.log(`Apply to: ${fileContent}`);
        Helpers.writeFile(file, r.mapFileContent(fileContent));
      } else {
        // Helpers.log(`Not apply to: ${fileContent}`);
      }
    });
    this.changeContent(files);
  }


}


function getAllFilesFoldersRecusively(folder: string, filesOnly = false) {
  let files = glob.sync(`${folder}/**/*.*`);
  if (!filesOnly) {
    let dirs = [folder]
    files.forEach(filePath => {
      const p = path.dirname(filePath);
      dirs = dirs.concat(
        fse.readdirSync(p).filter(f => fse.statSync(path.join(p, f)).isDirectory()).map(f => path.join(p, f))
      );
    });
    files = files.concat(dirs);
    files = Helpers.arrays.uniqArray(files);
  }
  return files.sort();
}
