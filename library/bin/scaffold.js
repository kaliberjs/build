#!/usr/bin/env node

// Based on https://github.com/facebookincubator/create-react-app/blob/2e82ebb3371731a5c4e346f310848ddb23fd0976/packages/react-scripts/scripts/init.js

const fs = require('fs-extra')
const path = require('path')
const spawn = require('cross-spawn')

const appPath = process.cwd()
const templatePath = path.resolve(__dirname, '../template')
const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'))

const appPackage = require(path.resolve(appPath, 'package.json'))

appPackage.scripts = Object.assign({}, appPath.scripts, {
  'build': 'NODE_ENV=production kaliber-build',
  'lint': 'kaliber-lint',
  'serve': 'kaliber-serve',
  'serve:dev': 'PORT=8000 CONFIG_ENV=dev kaliber-serve',
  'start': 'npm-run-all --parallel watch serve:dev',
  'watch': 'CONFIG_ENV=dev kaliber-watch'
})

// write package.json
fs.writeFileSync(
  path.resolve(appPath, 'package.json'),
  JSON.stringify(appPackage, null, 2)
)

// Copy the template
fs.copySync(templatePath, appPath, { overwrite: false })

// Rename gitignore after the fact to prevent npm from renaming it to .npmignore
// See: https://github.com/npm/npm/issues/1862
fs.move(
  path.join(appPath, 'gitignore'),
  path.join(appPath, '.gitignore'),
  [],
  err => {
    if (err) {
      // Append if there's already a `.gitignore` file there
      if (err.code === 'EEXIST') {
        const data = fs.readFileSync(path.join(appPath, 'gitignore'))
        fs.appendFileSync(path.join(appPath, '.gitignore'), data)
        fs.unlinkSync(path.join(appPath, 'gitignore'))
      } else {
        throw err
      }
    }
  }
)

// install dev depenendecy `npm-run-all`
const [ command, args ] = useYarn
  ? [ 'yarn', [ 'add', '--dev', 'npm-run-all' ] ]
  : [ 'npm', [ 'install', '--save-dev', 'npm-run-all' ] ]

const proc = spawn.sync(command, args, { stdio: 'inherit' })

if (proc.status !== 0) {
  console.error(`\`${command} ${args.join(' ')}\` failed`)
}
