#!/usr/bin/env node

// Based on https://github.com/facebookincubator/create-react-app/blob/2e82ebb3371731a5c4e346f310848ddb23fd0976/packages/react-scripts/scripts/init.js

const fs = require('fs-extra')
const path = require('path')
const spawn = require('cross-spawn')

const appPath = process.cwd()
const templatePath = path.resolve(__dirname, '../template')
const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'))

const packageJson = path.resolve(appPath, 'package.json')
const appPackage = require(packageJson)

appPackage.scripts = { ...(appPath.scripts || {}),
  'start': 'npm-run-all --parallel watch serve:dev',
  'watch': 'CONFIG_ENV=dev kaliber-watch',

  'build': 'NODE_ENV=production kaliber-build',

  'serve': 'kaliber-serve',
  'serve:dev': 'PORT=8000 CONFIG_ENV=dev kaliber-serve',

  'lint': 'npm-run-all --serial lint.javascript lint.styles',
  'lint.javascript': 'eslint -c .eslintrc --ignore-path .gitignore \'./**/*.js\'',
  'lint.styles': 'stylelint --config .stylelintrc --ignore-path .gitignore \'./**/*.css\'',
}

// write package.json
fs.writeFileSync(packageJson, JSON.stringify(appPackage, null, 2))

// Copy the template
fs.copySync(templatePath, appPath, { overwrite: false })

const templateGitIgnore = path.join(appPath, 'gitignore')
const gitignore = path.join(appPath, '.gitignore')
try {
  // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
  // See: https://github.com/npm/npm/issues/1862
  fs.moveSync(templateGitIgnore, gitignore)
} catch (e) { /* ignore if file exists */ }

// install dev depenendecy `npm-run-all`
const [ command, args ] = useYarn
  ? [ 'yarn', [ 'add', '--dev', 'npm-run-all' ] ]
  : [ 'npm', [ 'install', '--save-dev', 'npm-run-all' ] ]

const proc = spawn.sync(command, args, { stdio: 'inherit' })

if (proc.status !== 0) {
  console.error(`\`${command} ${args.join(' ')}\` failed`)
}
