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

const inquirer = require('inquirer')
const path = require('path')
const zipper = require('zip-local')
const crypto = require('crypto')
const fs = require('fs-extra')
const async = require('async')
const fetch = require('node-fetch')
const FormData = require('form-data')
const os = require('os')
const chalk = require('chalk')
const publicURL = 'https://beta.ideablock.io/cli/create-idea'
const privateURL = 'https://beta.ideablock.io/cli/create-idea-silent'
const parentURL = 'https://beta.ideablock.io/cli/get-parent-ideas'
const tokenURL = 'https://beta.ideablock.io/cli/update-token'
const authFilePath = path.join(os.homedir(), '.ideablock', 'auth.json')
const log = console.log
let parentArray = []
let jsonAuthContents = {}
let ideaDirName = ''
let ideaFile = ''
let tArray = ['None']
let question = [
  // Public or Private
  {
    type: 'list',
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
    type: 'list',
    name: 'thumb',
    message: 'Please select a thumbnail file from the list of idea files (or select none for default thumbnail)',
    choices: tArray
  }
]

// Subroutines
function authorize (callback) {
  banner()
  fs.pathExists(path.join(os.homedir(), '.ideablock', 'auth.json'), (err, exists) => {
    if (err) log(err)
    if (exists) {
      let authContents = fs.readFileSync(path.join(os.homedir(), '.ideablock', 'auth.json'))
      jsonAuthContents = JSON.parse(authContents)
      callback(null, jsonAuthContents.auth)
    } else {
      log(chalk.bold.rgb(255, 216, 100)('Please login with your IdeaBlock credentials.'))
      log(chalk.rgb(255, 216, 100)('(You can sign up at https://beta.ideablock.io)\n'))
      const loginQuestions = [
        {
          type: 'input',
          name: 'email',
          message: 'Email: '
        },
        {
          type: 'password',
          name: 'password',
          mask: '*',
          message: 'Password: '
        }
      ]
      inquirer.prompt(loginQuestions).then(answers => {
        const formData = new FormData()
        formData.append('email', answers.email)
        formData.append('password', answers.password)
        const options = {
          method: 'post',
          body: formData
        }
        fetch(tokenURL, options)
          .then(res => res.json())
          .then(json => {
            // writeAuthFile(json)
            jsonAuthContents = JSON.parse(json)
            fs.ensureFile(authFilePath)
              .then(() => {
                fs.writeJson(authFilePath, jsonAuthContents, () => callback(null, answers))
              })
              .catch(err => {
                console.error(err)
              })
          })
      })
    }
  })
}

function parents (callback) {
  let authJson = fs.readJsonSync(authFilePath)
  let fD = new FormData
  fD.append('api_token', authJson.auth)
  fetch(parentURL, { method: 'post', body: fD })
    .then(res => res.json())
    .then(function (json) {
      json.ideas.forEach(function (elem) {
        parentArray.push({ name: elem.id + ' - ' + elem.title, value: elem.id })
      })
      callback(null)
    })
    .catch(err => log(err))
}

function copyFiles (callback) {
  fs.ensureDir(path.join(__dirname, '.idea'))
    .then(() => {
      fs.readdir(__dirname, function (err, files) {
        if (err) {
          return log('Unable to read the files in the present directory')
        }
        var i = 0
        var fileArray = []
        files.forEach(function (file) {
          if (file.charAt(0) === '.' || fs.lstatSync(path.join(__dirname, file)).isDirectory()) {
            i = i + 1
            if (i === files.length - 1) {
              callback(null, fileArray)
            }
          } else {
            fs.copy(path.join(__dirname, file), path.join(__dirname, '.idea', file), (err) => {
              if (err) log(err)
              if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg')) {
                tArray.push(file)
              }
              i = i + 1
              fileArray.push(file)
              if (i === files.length) {
                fs.ensureDirSync(path.join(os.homedir(), '.ideablock', '.ideas'))
                callback(null, fileArray)
              }
            })
          }
        })
      })
    })
    .catch(err => {
      log(err)
    })
}

// Zip array of files
function ideaZip (callback) {
  let date = Math.floor(new Date() / 1000)
  ideaDirName = 'Idea-' + date
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
    callback(null, hash)
  })
}

function interaction (callback) {
  inquirer.prompt(question)
    .then(answers => {
      if (answers.publication === 'Public') {
        inquirer.prompt(questionsPublic)
          .then(answersPublic => {
            let ideaJSON = {
              'title': answersPublic.title,
              'description': answersPublic.description,
              'tags': answersPublic.tags,
              'thumb': answersPublic.thumb,
              'parents': answersPublic.parents,
              'publication': 'public'
            }
            fs.writeJson(path.join(__dirname, '.idea', 'idea.json'), ideaJSON, err => {
              if (err) log(err)
              callback(null, ideaJSON)
            })
          })
          .catch(err => log(err))
      } else {
        inquirer.prompt(questionsPrivate)
          .then(answersPrivate => {
            let ideaJSON = {
              'title': answersPrivate.title,
              'description': answersPrivate.description,
              'tags': answersPrivate.tags,
              'parents': answersPrivate.parents,
              'publication': 'private'
            }
            fs.writeJson(path.join(__dirname, '.idea', 'idea.json'), ideaJSON, err => {
              if (err) log(err)
              callback(null, ideaJSON)
            })
          })
      }
    })
}

function sendOut (resultsJSON) {
  if (resultsJSON.publication === 'public') {
    let ideaUp = path.join(__dirname, '.idea', 'ideaUp.json')
    fs.writeJson(ideaUp, resultsJSON, err => {
      if (err) log(err)
      const ideaFileInput = path.join(__dirname, '.idea', resultsJSON.ideaFileName)
      let formData = new FormData()
      formData.append('file[]', fs.createReadStream(ideaFileInput))
      formData.append('file[]', fs.createReadStream(ideaUp))
      const options = {
        method: 'POST',
        body: formData
      }
      fetch(publicURL, options)
        .then(res => res.json())
        .then(json => {
          var output = JSON.parse(json)
          log(chalk.bold.rgb(107, 200, 202)('\n\nCongratulations! Your idea has been successfully protected using IdeaBlock!\n'))
          log(chalk.bold.rgb(107, 200, 202)('Idea Information:'))
          log(chalk.bold.white('\nSHA-256 Hash of IdeaFile: ' + resultsJSON.hash))
          log(chalk.bold.yellow('Bitcoin Transaction: ' + output.BTC))
          log(chalk.bold.gray('Litecoin Transaction Hash: ' + output.LTC))
          fs.writeJSON(path.join(os.homedir(), '.ideablock', '.ideas', 'txHashes.json'), { BTC: output.BTC, LTC: output.LTC })
            .then(() => { fs.remove(path.join(__dirname, '.idea')) })
            .then(() => {
              log(chalk.bold.red('\nREMEMBER:\n') + chalk.bold.white('\t- The custody of your idea files and blockchain transaction hashes is solely up to you.\n\tPlease be sure to keep these files in a safe place. \n\tIf these files are misplaced, lost, or destroyed, verification of their existence at this moment in time will likely not be directly verifiable in the future without substantial difficulty.\n\tAccordingly, we recommend that you create one or more backups of the files in their local storage directory below.'))
              log(chalk.bold.blue.underline('Idea File Location\n') + chalk.bold.white('The permanent idea files representing this uploaded idea and a JSON file containing its corresponding blockchain-specific transaction hashes can be found at the following directory on the local filesystem:\n'))
              log(chalk.bold.blue(path.join(os.homedir(), '.ideablock', ideaDirName)))
            })
        }).catch((err) => log(err))
    })
  } else {
    let ideaUp = path.join(__dirname, '.idea', 'ideaUp.json')
    let resultsPrivateJSON = {}
    resultsPrivateJSON.hash = resultsJSON.hash
    resultsPrivateJSON.api_token = resultsJSON.api_token
    fs.writeJson(ideaUp, resultsPrivateJSON, err => {
      if (err) log(err)
      let formData = new FormData()
      formData.append('file', ideaUp)
      const options = {
        method: 'POST',
        body: formData
      }
      fetch(privateURL, options)
        .then(res => res.json())
        .then(json => {
          var output = JSON.parse(json)
          log(chalk.bold.rgb(107, 200, 202)('\n\nCongratulations! Your idea has been successfully protected using IdeaBlock!\n'))
          log(chalk.bold.rgb(107, 200, 202)('Idea Information:'))
          log(chalk.bold.white('\nSHA-256 Hash of IdeaFile: ' + resultsJSON.hash))
          log(chalk.bold.yellow('Bitcoin Transaction: ' + output.BTC))
          log(chalk.bold.gray('Litecoin Transaction Hash: ' + output.LTC))
          fs.writeJSON(path.join(os.homedir(), '.ideablock', '.ideas', 'txHashes.json'), { BTC: output.BTC, LTC: output.LTC })
            .then(() => { fs.remove(path.join(__dirname, '.idea')) })
            .then(() => {
              log(chalk.bold.red('\nREMEMBER:\n') + chalk.bold.white('\t- The custody of your idea files and blockchain transaction hashes is solely up to you.\n\tPlease be sure to keep these files in a safe place. \n\tIf these files are misplaced, lost, or destroyed, verification of their existence at this moment in time will likely not be directly verifiable in the future without substantial difficulty.\n\tAccordingly, we recommend that you create one or more backups of the files in their local storage directory below.'))
              log(chalk.bold.blue.underline('Idea File Location\n') + chalk.bold.white('The permanent idea files representing this uploaded idea and a JSON file containing its corresponding blockchain-specific transaction hashes can be found at the following directory on the local filesystem:\n'))
              log(chalk.bold.blue(path.join(os.homedir(), '.ideablock', ideaDirName)))
            })
        }).catch((err) => log(err))
    })
  }
}

// Helpers

function banner () {
  log(chalk.bold.white.underline('\n\n  WELCOME TO...\n\n  ========================================'))
  log(chalk.bold.gray('||                                        ||\n||') + chalk.bold.rgb(107, 200, 202)('  ###   #         ') + chalk.bold.rgb(65, 90, 166)('##   #          #  ') + chalk.bold.gray('   ||\n||  ') + chalk.bold.rgb(107, 200, 202)(' #  ### ###  ## ') + chalk.bold.rgb(65, 90, 166)('# #  #  ### ### # #') + chalk.bold.gray('   ||\n||  ') + chalk.bold.rgb(107, 200, 202)(' #  # # ##  # # ') + chalk.bold.rgb(65, 90, 166)('##   #  # # #   ## ') + chalk.bold.gray('   ||\n||  ') + chalk.bold.rgb(107, 200, 202)(' #  ### ### ### ') + chalk.bold.rgb(65, 90, 166)('# #  ## ### ### # #') + chalk.bold.gray('   ||\n||  ') + chalk.bold.rgb(107, 200, 202)('###             ') + chalk.bold.rgb(65, 90, 166)('##     ') + chalk.bold.rgb(255, 216, 100)('_') + chalk.bold.gray('              ||'))
  log(chalk.bold.gray('||  ') + chalk.bold.rgb(255, 216, 100)('                      \/ `  \/   \/') + chalk.bold.gray('      ||\n||') + chalk.bold.rgb(255, 216, 100)('                       \/_,  \/_, \/     ') + chalk.bold.gray('  ||'))
  log(chalk.bold.gray('||                                        ||\n  ========================================\n\n'))
}

// Execution
async.series([authorize, parents, copyFiles, interaction, ideaZip, hashFile],
  function (err, results) {
    if (err) log(err)
    fs.ensureDir(path.join(os.homedir(), '.ideablock', '.ideas', ideaDirName))
      .then(() => {
        fs.copy(path.join(__dirname, '.idea', results[4]), path.join(os.homedir(), '.ideablock', '.ideas', ideaDirName, results[4]), { overwrite: true })
          .then(() => {
            // results is now = [choiceArray, 'foo', fileArray, ideaJSON, ideaFileName, hash]
            let resultsJSON = {}
            let interaction = results[3]
            resultsJSON.hash = results[5]
            resultsJSON.ideaFileName = results[4]
            resultsJSON.publication = interaction.publication
            resultsJSON.title = interaction.title
            resultsJSON.thumb = interaction.thumb
            resultsJSON.description = interaction.description
            resultsJSON.parents = interaction.parents.join()
            resultsJSON.tags = interaction.tags
            resultsJSON.api_token = jsonAuthContents.auth
            resultsJSON.files = results[2].join()
            sendOut(resultsJSON)
          })
          .catch(err => {
            log(err)
          })
      })
      .catch(err => {
        log(err)
      })
  }
)
