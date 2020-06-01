

import * as path from 'path';
import * as fse from 'fs-extra';

const package_json = 'package.json';
const [p1, p2] = process.argv.slice(2);

const p1packagejson = fse.readJsonSync(path.join(p1, package_json), { encoding: 'utf8' }) as any;
const p2packagejson = fse.readJsonSync(path.join(p2, package_json), { encoding: 'utf8' }) as any;
p2packagejson.dependencies = p1packagejson.dependencies;
p2packagejson.devDependencies = p1packagejson.devDependencies;
fse.writeJsonSync(path.join(p2, package_json), p2packagejson, { encoding: 'utf8', spaces: 2 });
process.exit(0);
