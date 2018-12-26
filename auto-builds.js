module.exports = exports = function (base) {

  var whereTnpBundleNeeded = [
    `--copyto ${base}tsc-npm-project/projects/baseline`,
    `--copyto ${base}tsc-npm-project/projects/site`,
    `--copyto ${base}tsc-npm-project/projects/workspace`,
    `--copyto ${base}morphi/examples`
  ]

  var whereMorphiNeeded = [
    `--copyto ${base}tsc-npm-project`,
    `--copyto ${base}ng2-rest-swagger-generator`,
    `--copyto ${base}morphi/super-simple-morphi-example`,
  ].concat(whereTnpBundleNeeded)


  var whereNg2RestNeeded = [
    `--copyto ${base}ng2-rest/preview/server`,
    `--copyto ${base}ng2-rest/preview/client`,
    `--copyto ${base}morphi`
  ].concat(whereMorphiNeeded)


  var whereNg2LoggerNeeded = [
    `--copyto ${base}ng2-rest`
  ].concat(whereNg2RestNeeded)


  return [
    {
      "cwd": `${base}tsc-npm-project`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": whereTnpBundleNeeded
    },
    {
      "cwd": `${base}morphi`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": whereMorphiNeeded
    },
    {
      "cwd": `${base}ng2-rest`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": whereNg2RestNeeded
    },
    {
      "cwd": `${base}ng2-logger`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": whereNg2LoggerNeeded
    }

  ]

}
