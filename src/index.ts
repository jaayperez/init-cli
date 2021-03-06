#!/usr/bin/env node

import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import * as template from './utils/template';
// import * as chalk from 'chalk';
const chalk = require('chalk');
import * as yargs from 'yargs';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));

const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What project template would you like to start with?',
    choices: CHOICES,
    when: () => !yargs.argv['template']
  },
  {
    name: 'name',
    type: 'input',
    message: 'Project name:',
    when: () => !yargs.argv['name']
  }];

const CURR_DIR = process.cwd();

export interface CliOptions {
  projectName: string
  templateName: string
  templatePath: string
  targetPath: string
}

inquirer.prompt(QUESTIONS)
  .then(answers => {

    answers = Object.assign({}, answers, yargs.argv);

    const projectChoice = answers['template'];
    const projectName = answers['name'];
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const targetPath = path.join(CURR_DIR, projectName);

    const options: CliOptions = {
      projectName,
      templateName: projectChoice,
      templatePath,
      targetPath
    }

    createProject(targetPath);
    createDirectoryContents(templatePath, projectName);

    postProcess(options);

    console.log(options);
  });

function createProject(projectPath: string) {
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`${projectPath} exists. Please delete first.`));
    return false;
  }

  fs.mkdirSync(projectPath);

  return true;
}

function postProcess(options: CliOptions) {
  const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
  if (isNode) {
    shell.cd(options.targetPath);
    const result = shell.exec('npm install');
    if (result.code !== 0) {
      return false;
    }
  }

  return true;
}

// list of file/folder that should not be copied
const SKIP_FILES = ['node_modules', '.template.json'];
function createDirectoryContents(templatePath: string, projectName: string) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath);
  // loop each file/folder
  filesToCreate.forEach(file => {
    const origFilePath = path.join(templatePath, file);

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return;

    if (stats.isFile()) {
      // read file content and transform it using template engine
      let contents = fs.readFileSync(origFilePath, 'utf8');

      contents = template.render(contents, { projectName });

      // write file to destination folder
      const writePath = path.join(CURR_DIR, projectName, file);
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(CURR_DIR, projectName, file));
      // copy files/folder inside current folder recursively
      createDirectoryContents(path.join(templatePath, file), path.join(projectName, file));
    }
  });
}
