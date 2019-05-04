module.exports = exports = function (base) {
  //#region build
  return [
    {
      "cwd": `${base}ng2-logger`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}ng2-logger/preview/client`,
        `--bumbVersionIn ${base}ng2-logger/preview/server`,
        `--bumbVersionIn ${base}tsc-npm-project`
      ]
    },
    {
      "cwd": `${base}ng2-rest`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}ng2-rest/preview/client`,
        `--bumbVersionIn ${base}ng2-rest/preview/server`,
        `--bumbVersionIn ${base}tsc-npm-project`,
        `--bumbVersionIn ${base}ng2-rest-swagger-generator`
      ]
    },
    {
      "cwd": `${base}morphi`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}morphi/examples`,
        `--bumbVersionIn ${base}tsc-npm-project`
      ]
    },
    {
      "cwd": `${base}lodash-walk-object`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}morphi/examples`,
        `--bumbVersionIn ${base}tsc-npm-project`
      ]
    },
    {
      "cwd": `${base}json10`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}morphi/examples`,
        `--bumbVersionIn ${base}tsc-npm-project`
      ]
    },
    {
      "cwd": `${base}typescript-class-helpers`,
      "command": "tnp release",
      "args": [
        `--bumbVersionIn ${base}morphi/examples`,
        `--bumbVersionIn ${base}tsc-npm-project`
      ]
    }
  ]
  //#endregion
}
