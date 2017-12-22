#!/usr/bin/env node

const [ execPath, file, ...args ] = process.argv

if (!args.length) {
  process.argv = [execPath, file, '-c', '.eslintrc', 'src', 'config']
}

require('eslint/bin/eslint')
