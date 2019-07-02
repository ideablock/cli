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
const crypto = require('crypto') // encryption
const fs = require('fs') // this might not be needed, I think node made this to ship w/ latest LTS but will check
const async = require('async')
let thumbArray = []
let ideaJSON = {}
let parentPool = []
// Create IdeaBlock Directory
shell.mkdir('.idea')


/*
✓ "ideaName" : string,
✓ "ideaDescription" : string,
✓ "files" : []file,
  "parentIdeas" : []string,
✓ "tags" : []string,
✓ "ideaThumbnail" : file (image MIME),
  "csrf_token" : string,
  "parentIdeas" : []string
*/

const questions = [
  // Idea Title
  {
    type: 'input',
    name: 'title',
    message: 'Idea Title?'
  },
  {
    // Description
    type: 'input',
    name: 'description',
    message: 'Additional Description?'
  },

  // Parent Idea(s) - need to finish this after getting details on endpoint/return from Adam
  {
    type: 'checkbox',
    name: 'parent',
    message: 'Parent Idea(s)? (You can select multiple parent ideas)',
    choices:
  },
  // Thumbnail
  {
    type: 'checkbox',
    name: 'thumb',
    message: 'Please select a thumbnail file from the list of idea files (or select none for default thumbnail)',
    choices: thumbArray
  },

 // Tags
  {
    type: 'input',
    name: 'tags',
    message: 'Please enter any tags you would like to add to the idea (comma- or semicolon-separated list)'
  },
  // Public or Private
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

// Subroutines

// Copy all files into .idea directory (assumes flat structure, use recursion as upgrade)
function copyFiles (callback) {
  fs.readdir(__dirname, function (err, files) {
    if (err) {
      return console.log('Unable to read the files in the present directory --> ' + __dirname)
    }
    var i = 0
    var fileArray = []
    files.forEach(function (file) {
      if (file.charAt(0) == "."){
        i = i+1
        console.log(file + " skipped")
        if (i == files.length-1) {
          callback(fileArray)
        }
      } else {
        fs.copyFile(path.join(__dirname, file), path.join(__dirname, '.idea', file), (err) => {
          console.log(path.join(__dirname, '.idea', file) + 'written to .idea dir')
          if (fileArray.push(file) = files.length-1) {
            listImageFiles(fileArray)
            callback(fileArray)
          }
        })
      }
    })
  })
}

// Zip array of files
function ideaZip (callback) {
  let date = new Date()
  let ideaFileName = 'IdeaFile-' + date + '.zip'
  zipper.sync.zip('./.idea/').compress().save(ideaFileName)
  console.log(ideaFileName + ' written')
  callback(ideaFileName)
}

// Hash Idea File
function hashFile (ideaFileName, callback) {
  var shasum = crypto.createHash('sha256')
  var s = fs.ReadStream(path.join(__dirname, '.idea', ideaFileName))
  s.on('data', function (d) {shasum.update(d)})
  s.on('end', function () {
    var hash = shasum.digest('hex')
    console.log(hash)
    callback(hash)
  })
}

function interaction (files) {
  inquirer.prompt(questions)
    .then(answers => {
      {
        ideaJSON.title = answers.title
        ideaJSON.description = answers.description
        ideaJSON.thumb = answers.thumb
        ideaJSON.parent = answers.parent
        ideaJSON.tags = answers.tags
        console.log(ideaJSON)
        fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function(err) {
        })

      }
    })
}

function listImageFiles (fileArray) {
  var fileImageArray = []
  var i = 0
  for (file in fileArray) {
    if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg') || file.includes('.tiff')) {
      fileImageArray.push(file)
      i = i + 1
      if (i == filesArray.length - 1) {
        thumbArray = fileImageArray
      }
      else {
        i = i + 1
      }
    }
  }
}


async.series([/*login, getParentPool*/copyFiles, interaction, ideaZip, hashFile])

{
  ideaJSON.title = answers.title
  ideaJSON.description = answers.description
  ideaJSON.thumb = answers.thumb
  ideaJSON.parent = answers.parent
  ideaJSON.tags = answers.tags
  console.log(ideaJSON)
  fs.writeFile('idea.txt', ideaJSON, function(err) {
  console.log(err)
  console.log(answers)
  })

}