/*
 _____    _            _     _            _
  | |  __| | ___  __ _| |__ | | ___   ___| | __
  | | / _` |/ _ \/ _` | '_ \| |/ _ \ / __| |/ /
 _| || (_| |  __/ (_| | |_) | | (_) | (__|   <
|_____\__,_|\___|\__,_|_.__/|_|\___/ \___|_|\_\
______________________
__  ____/__  /____  _/
_  /    __  /  __  /
/ /___  _  /____/ /
\____/  /_____/___/
*/

const shell = require('shelljs')
const inquirer = require('inquirer')
const path = require('path')
const crypto = require('crypto') //encryption
const fs = require('fs') //this might not be needed, I think node made this to ship w/ latest LTS but will check
const JSZip = require('jszip')
const async = require('async')

//Create IdeaBlock Directory
shell.mkdir('.idea')
shell.cd('.idea')

//Create
let ideaJSON = {}

/*
"ideaName" : string,
"ideaDescription" : string,
"files" : []file,
"parentIdeas" : []string,
"tags" : []string,
"ideaThumbnail" : file (image MIME),
"csrf_token" : string,
"parentIdeas" : []string
*/

const questions = [{
  type: 'input',
  name:'title',
  message: 'Idea Title?'
},
{
  //Description
  type: 'input',
  name:'description',
  message: 'Additional Description?'
},
{
  //File selection (maybe)
  type: 'input',
  name:'title',
  message: 'Idea Title?'
},
{
  type: 'input',
  name:'title',
  message: 'Idea Title?'
},
{
  type: 'input',
  name:'title',
  message: 'Idea Title?'
},
{
  type: 'input',
  name:'title',
  message: 'Idea Title?'
},
{
  type: 'input',
  name:'title',
  message: 'Idea Title?'
}]

//Subroutines

//copy all files in directory
function copyFiles {

}

//Zip array of files
function ideaZip (files) {

  return ideaFile
}

//Encrypt Zip
function ideaFileEncrypt (ideaFile) {

...

return ideaFile
}

//Create idea.txt for title and description
function ideaText (title, description) {
  ...

  return ideaTextFile
}


inquirer.prompt(questions)
.then(answers => {
  ideaFile = ideaZip(answers.files)
  async.series([login, questions, ideaText, ])
  console.log(answers)
})


