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
const publicURL = 'http://app.ideablock.kek/cli/create-idea'
const privateURL = 'http://app.ideablock.kek/cli/create-idea-silent'
const parentURL = 'http://app.ideablock.kek/cli/get-parent-ideas'
const SortedSet = require('collections/sorted-set')
let thumbArray = []
let parentArray = []
let jsonAuthContents = {}
let ideaFile = ''

let question = [
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

let questionsPrivate = [
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
    name: 'parents',
    choices: parentArray

  },
  // Tags
  {
    type: 'input',
    name: 'tags',
    message: 'Please enter any tags you would like to add to the idea (comma- or semicolon-separated list)'
  }
]

let questionsPublic = [
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
    name: 'parents',
    choices: parentArray

  },
  // Tags
  {
    type: 'input',
    name: 'tags',
    message: 'Please enter any tags you would like to add to the idea (comma- or semicolon-separated list)'
  },
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

function parents (callback) {
  var fD = new FormData
  fD.append('api_token', jsonAuthContents.auth)
  fetch(parentURL, {method: 'post', body: fD})
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
          if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg')) {
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
  inquirer.prompt(question)
    .then(answers => {
      if (answers.publication[0] === 'Public') {
        inquirer.prompt(questionsPublic)
          .then(answersPublic => {

            let ideaJSON = {
              'title': answersPublic.title,
              'description': answersPublic.description,
              'tags': answersPublic.tags,
              'thumb':answersPublic.thumb || 'none',
              'parents': answersPublic.parents,
              'publication': 'public'
            }


            fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), JSON.stringify(ideaJSON), function (err) {
              if (err) console.log(err)
              callback(null, ideaJSON)
            })
          })
          .catch(err => console.log(err))
      } else {
        console.log('HELLO THERE PRIVATE')
        inquirer.prompt(questionsPrivate)
          .then(answersPrivate => {
            let ideaJSON = {
              'title': answersPrivate.title,
              'description': answersPrivate.description,
              'tags': answersPrivate.tags,
              'parents': answersPrivate.parents,
              'publication': 'private',
                'thumb':answersPrivate.thumb || 'none',
            }


            if(answersPublic.thumb == undefined) {
              ideaJSON.thumb = ''
            } else {
              ideaJSON.thumb = answersPublic.thumb
            }
            fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function (err) {
              if (err) console.log(err)
              callback(null, ideaJSON)
            })
          })
      }
    })
}

function sendOut (resultsJSON) {
  console.log('send out JSON: ' + JSON.stringify(resultsJSON))

  if (resultsJSON.publication === 'public') {
    const ideaFileInput = path.join(__dirname, '.idea', resultsJSON.ideaFileName)
    //const thumbFileInput = path.join(__dirname, '.idea', resultsJSON.thumb)
    let formData = new FormData()

    formData.append('file', fs.createReadStream(ideaFileInput))
    formData.append('thumb', resultsJSON.thumb.join())
    formData.append('title', resultsJSON.title)
    formData.append('description', resultsJSON.description)
    formData.append('hash', resultsJSON.hash)
    formData.append('parents', resultsJSON.parents.join())
    formData.append('tags', resultsJSON.tags)
    formData.append('api_token', resultsJSON.api_token)
    const options = {
      method: 'POST',
      body: formData
    }
    fetch(publicURL, options).then(
      res => res.json()).then(json => console.log(json))

  } else {
    let formData = new FormData()
    formData.append('title', resultsJSON.title)
    formData.append('description', resultsJSON.description)
    formData.append('hash', resultsJSON.hash)
    formData.append('parents', resultsJSON.parents.join())
    formData.append('tags', resultsJSON.tags)
    formData.append('thumb', resultsJSON.thumb.join())
    formData.append('api_token', resultsJSON.api_token)
    const options = {
      method: 'POST',
      body: formData
    }
    fetch(privateURL, options)
      .then(res => console.log('IdeaBlock server responded with: ' + res.json()))
      .then(json => shell.mv(path.join(__dirname, '.idea', resultsJSON.ideaFileName), path.join(__dirname, '.idea')))
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

/*function parentConvert (choices) {
  // let parentObject = {}
  if (choices.length === 0) {
    return 'none'
  } else {
    let ss = new SortedSet
    for (let i = 0; i <= choices.length; i++) {
      ss.push(parentArray[choices[i].value.toString()])
      if (i === choices.length) return ss
    }
  }
}
*/

// Execution
async.series([dotIdea, authorize, parents, interaction, copyFiles, ideaZip, hashFile],
  function (err, results) {
    if (err) console.log(err)
    // results is now = [choiceArray, 'foo', fileArray, ideaJSON, ideaFileName, hash]
    let resultsJSON = {}
    let interaction = results[3]
    console.log('Interaction:' + interaction + ' stringed ' + JSON.stringify(interaction))
    resultsJSON.hash = results[6]
    resultsJSON.ideaFileName = results[5]
    resultsJSON.publication = interaction.publication
    resultsJSON.title = interaction.title
    resultsJSON.thumb = interaction.thumb
    resultsJSON.description = interaction.description
    resultsJSON.parents = interaction.parents
    resultsJSON.tags = interaction.tags
    resultsJSON.api_token = results[1].auth
    console.log('resultsJSON: ' + JSON.stringify(resultsJSON))
    sendOut(resultsJSON)
  })

  /*Silent
    fileHash
    token
  public
    ZipFile
    fileHash
  */
