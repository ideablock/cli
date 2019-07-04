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
const crypto = require('crypto')
const fs = require('fs')
const async = require('async')
const fetch = require('node-fetch')
const FormData = require('form-data')
const os = require('os')
const Auth = require('./auth.js')
const publicURL = 'https://beta.ideablock.io/cli/create-idea'
const privateURL = 'https://beta.ideablock.io/cli/create-idea-silent'
let thumbArray = []
let ideaJSON = {}
let jsonAuthContents = {}
let ideaFile = ''



let questions = [
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
  {
    type: 'checkbox',
    message: 'Select any parent ideas you wish you use.',
    name: 'parentIdeas',
    choices: choiceArray

  },
  // Parent Idea(s) - need to finish this after getting details on endpoint/return from Adam
  // {
  //   type: 'checkbox',
  //   name: 'parent',
  //   message: 'Parent Idea(s)? (You can select multiple parent ideas)',
  //   choices: [ ]
  // },
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

function authorize (callback) {
  if (process.argv.slice(2) !== '') {
    if (process.argv.slice(2) === '--update-token') {
      const loginQuestions = [
        {
          type: 'input',
          name: 'email',
          message: 'Email: '
        },
        {
          type: 'input',
          name: 'password',
          message: 'Password: '
        }
      ]
      inquirer.prompt(loginQuestions).then(answers => {
        const auth = new Auth(answers.email, answers.password)
        callback(null, 'foo')
      })
    }
  } else {
    shell.mkdir('.idea')
    var authContents = fs.readFileSync(os.homedir() + '/.ideablock/auth.json')
    jsonAuthContents = JSON.parse(authContents)
    print(jsonAuthContents.auth)
    callback(null, 'foo')
  }
}

function parentIdeas (callback) {
  fetch('https://ideablock.io/cli/get-parent-ideas', { method: 'post', body: { 'api_token': jsonAuthContents.auth } })
    .then(res => {
      resu.ideas = res.json()
      var choiceArray = [res.json]
      async.each(result.ideas, function (idea, callback) {
        choiceArray.push({
          name: idea.id + '- ' + idea.title,
          value: idea.id
        })
        callback()
      }, function (err) {
        if (err) console.log(err)
        callback(null, choiceArray)
      })
    })
}

function copyFiles (callback) {
  fs.readdir(__dirname, function (err, files) {
    if (err) {
      return console.log('Unable to read the files in the present directory')
    }
    var i = 0
    var fileArray = []
    files.forEach(function (file) {
      if (file.charAt(0) === '.' || fs.lstatSync(path.join(__dirname, file)).isDirectory()) {
        i = i + 1
        console.log(file + ' skipped')
        if (i === files.length - 1) {
          callback(null, fileArray)
        }
      } else {
        fs.copyFile(path.join(__dirname, file), path.join(__dirname, '.idea', file), (err) => {
          if (err) console.log(err)
          console.log(path.join(__dirname, '.idea', file) + ' written to .idea dir')
          if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg') || file.includes('.tiff')) {
            thumbArray.push(file)
          }
          i = i + 1
          console.log('i = ' + i + '; files.length = ' + files.length)
          fileArray.push(file)
          if (i === files.length) {
            console.log('File Array: ' + fileArray)
            console.log('Thumb Array ' + thumbArray)
            callback(null, fileArray)
          }
        })
      }
    })
  })
}

// Zip array of files
function ideaZip (callback) {
  let date = Math.floor(new Date() / 1000)
  let ideaFileName = 'IdeaFile-' + date + '.zip'
  zipper.sync.zip(path.join(__dirname, '.idea')).compress().save(path.join(__dirname, '.idea', ideaFileName))
  ideaFile = ideaFileName
  console.log(ideaFileName + ' written')
  callback(null, ideaFileName)
}

// Hash Idea File
function hashFile (callback) {
  var shasum = crypto.createHash('sha256')
  var s = fs.ReadStream(path.join(__dirname, '.idea', ideaFile))
  s.on('data', function (d) { shasum.update(d) })
  s.on('end', function () {
    var hash = shasum.digest('hex')
    console.log(hash)
    callback(null, hash)
  })
}

function interaction (callback) {
  inquirer.prompt(questions)
    .then(answers => {
      ideaJSON = answers
      console.log(ideaJSON)
      fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function (err) {
        if (err) console.log(err)
        callback(null, ideaJSON)
      })
    })
}

function sendOut (ideaJSON) {
  if (ideaJSON.publication[0] === 'Public') {
    const ideaFileInput = path.join(__dirname, '.idea', ideaJSON.ideaFileName)
    const formData = new FormData()
    formData.append('file', fs.createReadStream(ideaFileInput))
    for (var ideaJsonPart in ideaJSON) {
      formData.append(ideaJsonPart, ideaJSON[ideaJsonPart])
    }
    const options = {
      method: 'POST',
      body: formData
    }
    fetch(publicURL, options)
  } else {
    let formData = new FormData()
    formData.append(ideaJSON)
    const options = {
      method: 'POST',
      body: formData
    }
    fetch(privateURL, options).then(res => console.log('IdeaBlock server responded with: ' + res))
  }
}

function print (param) {
  console.log(param)
}

// Execution
async.series([authorize, parentIdeas, copyFiles, interaction, ideaZip, hashFile],
  function (err, results) {
    if (err) console.log(err)
    // results is now = ['foo', choiceArray, fileArray, ideaJSON, ideaFileName, hash]
    ideaJSON = results[3]
    ideaJSON.files = results[2]
    ideaJSON.hash = results[5]
    ideaJSON.ideaFileName = results[4]
    sendOut(ideaJSON)
  })
