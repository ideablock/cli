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
const zipper = require('zip-local')
const crypto = require('crypto') //encryption
const fs = require('fs') //this might not be needed, I think node made this to ship w/ latest LTS but will check
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
  name: 'tags',
  message: 'Idea Title?'
},
{
  type: 'input',
  name: 'title',
  message: 'Idea Title?'
},
{
  //Description
  type: 'input',
  name: 'description',
  message: 'Additional Description?'
},
//Parent Idea(s) - need to finish this after getting details on endpoint/return from Adam
{
  type: 'checkbox',
  name: 'parent',
  message: 'Parent Idea(s)? (You can select multiple parent ideas)'
},
//Thumbnail
{
  type: 'checkbox',
  name: 'thumb',
  message: 'Please select a thumbnail file from the list of idea files (or select none for default thumbnail)',
  choices: [
    //list files in .idea as separate choices (those with .png, .jpg, .jpeg mime types)
  ]
},
//Tags
{
  type: 'input',
  name: 'tags',
  message: 'Please enter any tags you would like to add to the idea (comma- or semicolon-separated list)'
},
//Public or Private
{
  type: 'checkbox',
  message: 'Would you like this idea to be public or private?',
  name: 'publication',
  choices: [
    {
      name: 'Public',
      checked: true
    },
    {
      name: 'Private'
    }
  ]
}]

//Subroutines

//copy all files into .idea directory
function copyFiles(callback) {
  fs.readdir(__dirname, function (err, files) {
    if (err) {
      return console.log('Unable to read the files in the present directory --> ' + __dirname)
    }
    files.forEach(function (file) {
      fs.copyFile(path.join(__dirname, file), path.join(__dirname, '.idea', file), (err) => {
        console.log(path.join(__dirname, '.idea', file) + 'written to .idea dir')
      })
    })
  })
}

//Zip array of files
function ideaZip(callback) {
  let date = new Date()
  let ideaFileName = 'IdeaFile-' + date + '.zip'
  zipper.sync.zip('./.idea/').compress().save(ideaFileName)
  console.log(ideaFileName + ' written')
  callback(ideaFileName)
}

function hashFile(callback) {

}

//Create idea.txt for title and description
function ideaText(title, description) {
  ...

  return ideaTextFile
}


inquirer.prompt(questions)
  .then(answers => {
    ideaFile = ideaZip(answers.files)
    async.series([login, questions, ideaText,])
    console.log(answers)
  })


