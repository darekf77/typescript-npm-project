import {
  glob,
  Helpers,
  crossPlatformPath,
  child_process,
} from 'tnp-core';

Helpers.remove([__dirname, 'dist']);
const tsFiles = glob.sync(crossPlatformPath([__dirname, `src/**/*.ts`]));
// console.log('tsFiles', tsFiles);
for (const absFilePath of tsFiles) {
  const content = Helpers.readFile(absFilePath) || '';
  Helpers.writeFile(
    absFilePath,
    content
      .replace(/(?<!\.)\/src\'\;/g, `/lib';`)
      .replace(/(?<!\.)\/src\"\;/g, `/lib";`),
  );
}

console.info('Check your files and press any key');
require('child_process').spawnSync('read _ ', {
  shell: true,
  stdio: [0, 1, 2],
});

console.info('Compiling typescript files...');
child_process.execSync('npm-run tsc --outDir dist', {
  stdio: 'inherit',
});
console.info('Typescript files compiled.');

for (const absFilePath of tsFiles) {
  const content = Helpers.readFile(absFilePath) || '';
  Helpers.writeFile(
    absFilePath,
    content
      .replace(/(?<!\.)\/lib\'\;/g, `/src';`)
      .replace(/(?<!\.)\/lib\"\;/g, `/src";`) + '\n',
  );
}
