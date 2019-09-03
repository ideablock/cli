#!/usr/bin/env node

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
const fs = require('fs-extra')
const async = require('async')
const fetch = require('node-fetch')
const FormData = require('form-data')
const os = require('os')
const Table = require('cli-table2')
const chalk = require('chalk')
const figlet = require('figlet')
const ora = require('ora')
const boxen = require('boxen')
const crypto = require('crypto')
const publicPrivateURL = 'https://beta.ideablock.io/cli/create-idea'
const secretURL = 'https://beta.ideablock.io/cli/create-idea-silent'
const parentURL = 'https://beta.ideablock.io/cli/get-parent-ideas'
const tokenURL = 'https://beta.ideablock.io/cli/update-token'
const authFilePath = path.join(os.homedir(), '.ideablock', 'auth.json')
const log = console.log
const spinUp = {
  interval: 100,
  frames: [
    '🖥️💡------------------------------⛓️',
    '🖥️-💡-----------------------------⛓️',
    '🖥️--💡----------------------------⛓️',
    '🖥️---💡---------------------------⛓️',
    '🖥️----💡--------------------------⛓️',
    '🖥️-----💡-------------------------⛓️',
    '🖥️------💡------------------------⛓️',
    '🖥️-------💡-----------------------⛓️',
    '🖥️--------💡----------------------⛓️',
    '🖥️---------💡---------------------⛓️',
    '🖥️----------💡--------------------⛓️',
    '🖥️-----------💡-------------------⛓️',
    '🖥️------------💡------------------⛓️',
    '🖥️-------------💡-----------------⛓️',
    '🖥️--------------💡----------------⛓️',
    '🖥️---------------💡---------------⛓️',
    '🖥️----------------💡--------------⛓️',
    '🖥️-----------------💡-------------⛓️',
    '🖥️------------------💡------------⛓️',
    '🖥️-------------------💡-----------⛓️',
    '🖥️--------------------💡----------⛓️',
    '🖥️---------------------💡---------⛓️',
    '🖥️----------------------💡--------⛓️',
    '🖥️-----------------------💡-------⛓️',
    '🖥️------------------------💡------⛓️',
    '🖥️-------------------------💡-----⛓️',
    '🖥️--------------------------💡----⛓️',
    '🖥️---------------------------💡---⛓️',
    '🖥️----------------------------💡--⛓️',
    '🖥️-----------------------------💡-⛓️',
    '🖥️------------------------------💡⛓️',
    '🖥️--------------------------------💡',
    '🖥️--------------------------------💡',
    '🖥️--------------------------------💡',
    '🖥️--------------------------------💡',
    '🖥️--------------------------------💡',
    '🖥️--------------------------------💡'
  ]
}
const parentArray = []
let jsonAuthContents = {}
let ideaDirName = ''
let ideaFile = ''
const tArray = ['None']
const question = [
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
      },
      {
        name: 'Secret'
      }
    ]
  }
]

const questionsSecret = [
  // Idea Title
  {
    type: 'input',
    name: 'title',
    message: 'Idea title?'
  },
  {
    // Description
    type: 'input',
    name: 'description',
    message: 'Additional description?'
  },
  {
    type: 'checkbox',
    message: 'Select any parent ideas:',
    name: 'parents',
    choices: parentArray

  },
  // Tags
  {
    type: 'input',
    name: 'tags',
    message: 'Add tags (comma- or semicolon-separated list)'
  }
]

const questionsPublicPrivate = [
  // Idea Title
  {
    type: 'input',
    name: 'title',
    message: 'Idea title?'
  },
  {
    // Description
    type: 'input',
    name: 'description',
    message: 'Additional description?'
  },
  {
    type: 'checkbox',
    message: 'Select any parent ideas.',
    name: 'parents',
    choices: parentArray

  },
  // Tags
  {
    type: 'input',
    name: 'tags',
    message: 'Please enter any tags you would like to add to the idea (comma-separated list)'
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
const authorize = function (callback) {
  fs.pathExists(path.join(os.homedir(), '.ideablock', 'auth.json'), (err, exists) => {
    if (err) log(err)
    if (exists) {
      const authContents = fs.readFileSync(path.join(os.homedir(), '.ideablock', 'auth.json'))
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
      inquirer.prompt(loginQuestions)
        .then(answers => {
          const formData = new FormData()
          formData.append('email', answers.email)
          formData.append('password', answers.password)
          const options = {
            method: 'post',
            body: formData
          }
          fetch(tokenURL, options)
            .then(res => {
              if (res.status === 500) {
                res.json()
                  .then((obj) => {
                    log(chalk.red('\nWe cannot seem to find an IdeaBlock account with those credentials.'))
                    log(chalk.red('Please visit https://beta.ideablock.io to register.\n'))
                    process.exit(0)
                  })
                  .catch((err) => {
                    console.log(chalk.red('\nWe cannot find an IdeaBlock account with those credentials.\nPlease visit https://beta.ideablock.io to register.\n'))
                    process.exit(0)
                  })
              } else if (res.status === 200) {
                res.json()
                  .then(obj => {
                    jsonAuthContents = JSON.parse(obj)
                    fs.ensureFile(authFilePath)
                      .then(() => fs.writeJson(authFilePath, jsonAuthContents, () => callback(null, answers)))
                      .catch((err) => console.log(err))
                  })
                  .catch((err) => {
                    log(chalk.red('\nIncorrect password, please try again.\n'))
                  })
              }
            })
        })
    }
  })
}

function parents (callback) {
  const authJson = fs.readJsonSync(authFilePath)
  const fD = new FormData
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
  fs.emptyDir(path.join(process.cwd(), '.idea'))
    .then(() => {
      fs.readdir(process.cwd(), function (err, files) {
        if (err) {
          return log('Unable to read the files in the present directory')
        }
        var i = 0
        var fileArray = []
        files.forEach(function (file) {
          if (file.charAt(0) === '.' || fs.lstatSync(path.join(process.cwd(), file)).isDirectory()) {
            i = i + 1
            if (i === files.length - 1) {
              callback(null, fileArray)
            }
          } else {
            fs.copy(path.join(process.cwd(), file), path.join(process.cwd(), '.idea', file), (err) => {
              if (err) log(err)
              if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg')) {
                tArray.push(file)
              }
              i = i + 1
              fileArray.push(file)
              if (i === files.length) {
                fs.ensureDirSync(path.join(os.homedir(), '.ideablock', 'ideas'))
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
  const date = Math.floor(new Date() / 1000)
  ideaDirName = 'Idea-' + date
  const ideaFileName = 'IdeaFile-' + date + '.zip'
  zipper.sync.zip(path.join(process.cwd(), '.idea')).compress().save(path.join(process.cwd(), '.idea', ideaFileName))
  ideaFile = ideaFileName
  callback(null, ideaFileName)
}

// Hash Idea File
function hashFile (callback) {
  var shasum = crypto.createHash('sha256')
  var s = fs.ReadStream(path.join(process.cwd(), '.idea', ideaFile))
  s.on('data', function (d) { shasum.update(d) })
  s.on('end', function () {
    var hash = shasum.digest('hex')
    callback(null, hash)
  })
}

function interaction (callback) {
  log('')
  log(boxen('💡💡💡   NEW IDEA   💡💡💡', { padding: 0, borderColor: 'cyan' }))
  inquirer.prompt(question)
    .then(answers => {
      if (answers.publication === 'Public' || answers.publication === 'Private') {
        inquirer.prompt(questionsPublicPrivate)
          .then(answersPublicPrivate => {
            const ideaJSON = {
              'title': answersPublicPrivate.title,
              'description': answersPublicPrivate.description,
              'tags': answersPublicPrivate.tags,
              'thumb': answersPublicPrivate.thumb,
              'parents': answersPublicPrivate.parents
            }
            if (answers.publication === 'Public') { ideaJSON.publication = 'public' }
            if (answers.publication === 'Private') { ideaJSON.publication = 'private' }
            fs.writeJson(path.join(process.cwd(), '.idea', 'idea.json'), ideaJSON, err => {
              if (err) log(err)
              callback(null, ideaJSON)
            })
          })
          .catch(err => log(err))
      } else {
        inquirer.prompt(questionsSecret)
          .then(answersSecret => {
            const ideaJSON = {
              'title': answersSecret.title,
              'description': answersSecret.description,
              'tags': answersSecret.tags,
              'parents': answersSecret.parents,
              'publication': 'secret'
            }
            fs.writeJson(path.join(process.cwd(), '.idea', 'idea.json'), ideaJSON, err => {
              if (err) log(err)
              callback(null, ideaJSON)
            })
          })
      }
    })
}

function sendOut (resultsJSON) {
  log('')
  const spinner = new ora({
    spinner: spinUp,
    indent: 5
  })
  spinner.start('  Tethering Idea to Blockchains')
  if (resultsJSON.publication === 'public' || resultsJSON.publication === 'private') {
    const ideaUp = path.join(process.cwd(), '.idea', 'ideaUp.json')
    fs.writeJson(ideaUp, resultsJSON, err => {
      if (err) log(err)
      const ideaFileInput = path.join(process.cwd(), '.idea', resultsJSON.ideaFileName)
      const formData = new FormData()
      formData.append('file[]', fs.createReadStream(ideaFileInput))
      formData.append('file[]', fs.createReadStream(ideaUp))
      const options = {
        method: 'POST',
        body: formData
      }
      fetch(publicPrivateURL, options)
        .then(res => res.json())
        .then(json => {
          spinner.stop()
          fs.copySync(ideaUp, path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName, 'ideaMeta.json'))
          var output = JSON.parse(json)
          log('\t✅ Congratulations! Your idea has been successfully protected using IdeaBlock!\n')
          fs.writeJSON(path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName, 'ideaHashes.json'), { BTC: output.BTC, LTC: output.LTC })
            .then(() => {
              fs.remove(path.join(process.cwd(), '.idea'))
            })
            .then(() => {
              const table = new Table({ style: { head: [], border: [] } })
              table.push(
                [{ colSpan: 2, content: chalk.bold.red('Idea Information:') }],
                [chalk.white('Idea File Hash: '), resultsJSON.hash],
                [chalk.yellow('Bitcoin Hash: '), output.BTC],
                [chalk.gray('Litecoin Hash: '), output.LTC],
                [chalk.blue('Idea File Location'), path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName)]
              )
              console.log(table.toString())
            })
        }).catch((err) => log(err))
    })
  } else {
    const ideaUp = path.join(process.cwd(), '.idea', 'ideaUp.json')
    const resultsSecretJSON = {}
    resultsSecretJSON.hash = resultsJSON.hash
    resultsSecretJSON.api_token = resultsJSON.api_token
    fs.writeJson(ideaUp, resultsSecretJSON, err => {
      if (err) log(err)
      const formData = new FormData()
      formData.append('file', fs.createReadStream(ideaUp))
      const options = {
        method: 'POST',
        body: formData
      }
      fetch(secretURL, options)
        .then(res => res.json())
        .then(json => {
          spinner.stop()
          fs.copySync(ideaUp, path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName, 'ideaMeta.json'))
          var output = JSON.parse(json)
          log('\n\t✅ Congratulations! Your idea has been successfully protected using IdeaBlock!\n')
          fs.writeJSON(path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName, 'ideaHashes.json'), { BTC: output.BTC, LTC: output.LTC })
            .then(() => {
              fs.remove(path.join(process.cwd(), '.idea'))
            })
            .then(() => {
              const table = new Table({ style: { head: [], border: [] } })
              table.push(
                [{ colSpan: 2, content: chalk.bold.red('Idea Information:') }],
                [chalk.white('Idea File Hash: '), resultsJSON.hash],
                [chalk.yellow('Bitcoin Hash: '), output.BTC],
                [chalk.gray('Litecoin Hash: '), output.LTC],
                [chalk.blue('Idea File Location'), path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName)]
              )
              console.log(table.toString())
              console.log('')
            })
        }).catch((err) => log(err))
    })
  }
}

// Helpers

function banner () {
  log('\n')
  log(figlet.textSync('IdeaBlock', {
    font: 'slant',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }))
}

// Execution
banner()
async.series([authorize, parents, copyFiles, interaction, ideaZip, hashFile],
  function (err, results) {
    if (err) log(err)
    fs.ensureDir(path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName))
      .then(() => {
        fs.copy(path.join(process.cwd(), '.idea', results[4]), path.join(os.homedir(), '.ideablock', 'ideas', ideaDirName, results[4]), { overwrite: true })
          .then(() => {
            // results is now = [choiceArray, 'foo', fileArray, ideaJSON, ideaFileName, hash]
            const resultsJSON = {}
            const interaction = results[3]
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
