#!/usr/bin/env node

import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));

const QUESTIONS = [
{
    name: 'template',
    type: 'list',
    message: 'What project template would you like to start with?',
    choices: CHOICES
},
{
    name: 'name',
    type: 'input',
    message: 'Project name:'
}];

inquirer.prompt(QUESTIONS)
.then(answers => {
    console.log(answers);
});
