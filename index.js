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
const parentURL = 'https://beta.ideablock.io/cli/get-parent-ideas'
let thumbArray = []
let parentArray = []
let parentObject = {}
let ideaJSON = {}
let jsonAuthContents = {}
let ideaFile = ''

let questions1 = [
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
    choices: parentArray

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
  }
]

let questionsPublic = [
  // Thumbnail
  {
    type: 'checkbox',
    name: 'thumb',
    message: 'Please select a thumbnail file from the list of idea files (or select none for default thumbnail)',
    choices: thumbArray
  }
]

// Subroutines
// Copy all files into .idea directory (assumes flat structure, use recursion as upgrade)

function authorize (callback) {
  if (!fs.existsSync(path.join(os.homedir(), '.ideablock', 'auth.json'))) {
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
      callback(null, auth)
    })
  } else {
    var authContents = fs.readFileSync(os.homedir() + '/.ideablock/auth.json')
    jsonAuthContents = JSON.parse(authContents)
    print(jsonAuthContents.auth)
    callback(null, jsonAuthContents)
  }
}

function parentIdeas (callback) {
  var fD = new FormData
  fD.append('api_token', jsonAuthContents.auth)
  fetch(parentURL, { method: 'post', body: fD})
    .then(res => res.json())
    .then(function (json) {
      console.log(json)
      json.ideas.forEach(function (elem) {
        parentArray.push({name: elem.id + ' - ' + elem.title, value: elem.id})
      })
      callback(null)
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
          if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg') || file.includes('.tiff')) {
            thumbArray.push(file)
          }
          i = i + 1
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
  inquirer.prompt(questions1)
    .then(answers => {
      if (answers[0] === ['Public']) {
        inquirer.prompt(questionsPublic)
          .then(answersPublic => {
            console.log(ideaJSON.thumb = answersPublic[0].thumb)
            console.log('ideaJSON inside Interaction: ' + ideaJSON)
            fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function (err) {
              if (err) console.log(err)
              callback(null, ideaJSON)
            })
          })
          .catch(err => console.log(err))
      } else {
        fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function (err) {
          if (err) console.log(err)
          callback(null, ideaJSON)
        })
      }
    })
}

function sendOut (ideaJSON) {
  console.log("IDEAJSON: " + ideaJSON)
  if (ideaJSON.publication === 'Public') {
    const ideaFileInput = path.join(__dirname, '.idea', ideaJSON.ideaFileName)
    const formData = new FormData()
    formData.append('file', fs.createReadStream(ideaFileInput))
    formData.append('title', ideaJSON.title)
    formData.append('description', ideaJSON.description)
    formData.append('parentIdeas', arrayToObject(parentArray))
    formData.append('thumb', ideaJSON.thumb)
    formData.append('tags', ideaJSON.tags)
    formData.append('publication', ideaJSON.publication)
    formData.append('api_token', jsonAuthContents.auth)
    console.log(formData)
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
    fetch(privateURL, options)
      .then(res => console.log('IdeaBlock server responded with: ' + res.json()))
      .then(json => shell.mv(path.join(__dirname, '.idea', ideaJSON.ideaFileName), path.join(__dirname, '.idea')))
  }
}

// Helpers
const arrayToObject = (arr) => Array.prototype.reduce((obj, item) => {
  obj[item.id] = item
  return obj
}, {})

/*const arrayToObjectKey = (array, keyField) => array.reduce((obj, item) => {
  obj[item[keyField]] = item
  return obj
}, {}) */

function print (param) {
  console.log(param)
}

function dotIdea (callback) {
  if (fs.existsSync(path.join(__dirname, '.idea'))) {
    callback(null)
  } else {
    console.log('Welcome to IdeaBlock Beta.')
    shell.mkdir('.idea')
    callback(null)
  }
}

// Execution
async.series([dotIdea, authorize, parentIdeas, interaction, copyFiles, ideaZip, hashFile],
  function (err, results) {
    if (err) console.log(err)
    // results is now = [choiceArray, 'foo', fileArray, ideaJSON, ideaFileName, hash]
    //ideaJSON[hash] = results[6]
    //ideaJSON.ideaFileName = results[5]
    console.log('res' + results)
    console.log('ato' + JSON.stringify(results))
    sendOut(arrayToObject(results))
  })

/*Silent
  fileHash
  token
public
  ZipFile
  fileHash
*/