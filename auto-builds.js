module.exports = exports = function (base) {

  return [
    {
      "cwd": `${base}tsc-npm-project`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": [
        `--copyto ${base}tsc-npm-project/projects/baseline`,
        `--copyto ${base}tsc-npm-project/projects/site`,
        `--copyto ${base}tsc-npm-project/projects/workspace`,
        `--copyto ${base}morphi/examples`
      ]
    },
    {
      "cwd": `${base}ng2-rest`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": [
        `--copyto ${base}morphi`,
        `--copyto ${base}tsc-npm-project/projects/baseline`,
        `--copyto ${base}tsc-npm-project/projects/site`,
        `--copyto ${base}tsc-npm-project/projects/workspace`,
        `--copyto ${base}morphi/examples`,
        `--copyto ${base}morphi/super-simple-morphi-example`
      ]
    },
    {
      "cwd": `${base}ng2-logger`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": [
        `--copyto ${base}morphi`,
        `--copyto ${base}tsc-npm-project/projects/baseline`,
        `--copyto ${base}tsc-npm-project/projects/site`,
        `--copyto ${base}tsc-npm-project/projects/workspace`,
        `--copyto ${base}ng2-rest`,
        `--copyto ${base}morphi/examples`,
        `--copyto ${base}morphi/super-simple-morphi-example`
      ]
    },
    {
      "cwd": `${base}morphi`,
      "command": "tnp build:dist",
      "commandWatch": "tnp build:dist:watch",
      "args": [
        `--copyto ${base}tsc-npm-project`,
        `--copyto ${base}tsc-npm-project/projects/baseline`,
        `--copyto ${base}tsc-npm-project/projects/site`,
        `--copyto ${base}tsc-npm-project/projects/workspace`,
        `--copyto ${base}morphi/examples`,
        `--copyto ${base}morphi/super-simple-morphi-example`
      ]
    }
  ]

}
