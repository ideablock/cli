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
const fetch = require('node-fetch')
const FormData = require('form-data')
const publicURL = 'https://134.209.35.210/cli/create-idea'
const privateURL = 'https://134.209.35.210/cli/create-idea-silent'
const tokenURL = 'https://ideablock.io/cli/update-token'
const os = require('os') 

const auth = require('./auth.js') 

let thumbArray = []
let ideaJSON = {}
let ideaFile = ''

//let parentPool = []
// Create IdeaBlock Directory
const print = (param) => { 
  console.log(param) 
}

if(process.argv.slice(2) != "") {
   if(process.argv.slice(2) == "--update-token") {
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
        new auth(answers.email, answers.password) 
        return
      })
   }
} else {

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
var token 
var authContents = fs.readFileSync(os.homedir()+'/.ideablock/auth.json') 
var jsonAuthContents = JSON.parse(authContents) 
print(jsonAuthContents.auth) 

const parentIdeas = () => {
  return fetch('https://ideablock.io/cli/get-parent-ideas', {method: "post", body: {"api_token":jsonAuthContents.auth}}).then(res => res.json())
}


parentIdeas().then(function(result) {
print(result.ideas) 

var choice_array = [] 
result.ideas.forEach(function(idea) {
  choice_array.push({
    name: idea.id + "- " +idea.title, 
    value: idea.id
  })
})  

var questions = [
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
    choices: 
      choice_array
    
  },
  // Parent Idea(s) - need to finish this after getting details on endpoint/return from Adam
 //{
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
          callback(null, fileArray)
        }
      } else {
        fs.copyFile(path.join(__dirname, file), path.join(__dirname, '.idea', file), (err) => {
          console.log(path.join(__dirname, '.idea', file) + ' written to .idea dir')
        if (file.includes('.png') || file.includes('.jpg') || file.includes('.jpeg') || file.includes('.tiff')){  
          thumbArray.push(file)
        }
          i = i + 1
          console.log('i = ' + i + "; files.length = " + files.length)
          fileArray.push(file)
          if (i == files.length) {
            console.log("File Array: " + fileArray)
            console.log("Thumb Array " + thumbArray)
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
  callback(null,ideaFileName)
}

// Hash Idea File
function hashFile (callback) {
  var shasum = crypto.createHash('sha256')
  var s = fs.ReadStream(path.join(__dirname, '.idea', ideaFile))
  s.on('data', function (d) {shasum.update(d)})
  s.on('end', function () {
    var hash = shasum.digest('hex')
    console.log(hash)
    callback(null, hash)
  })
}

function interaction (callback) {
  inquirer.prompt(questions)
    .then(answers => {
      {
        ideaJSON = answers
        console.log(ideaJSON)
        fs.writeFile(path.join(__dirname, '.idea', 'idea.txt'), ideaJSON, function(err) {
          callback(null, ideaJSON)
        })

      }
    })
}



function sendOut(ideaJSON) {
  if (ideaJSON.publication[0] == 'Public') {
    const ideaFileInput = path.join(__dirname, '.idea', ideaJSON.ideaFileName)
    const formData = new FormData()
    formData.append('file', fs.createReadStream(ideaFileInput))
    for(ideaJson_part in ideaJSON) {
      formData.append(ideaJson_part, ideaJSON[ideaJson_part])
    }
    const options = {
      method: 'POST',
      body: formData
    }
    fetch(publicURL, options)
  }
  else{
    let formData = new FormData()
    formData.append(ideaJSON)
    const options = {
      method: 'POST',
      body: formData
    }
    fetch('http://app.ideablock.kek/cli/create-idea', options).then(res => console.log('IdeaBlock server responsed with: ' + res))
  }
}

//ADD THESE
/*
function getParentPool() {

}

function login() {

}*/



async.series([/*login, getParentPool,*/copyFiles, interaction, ideaZip, hashFile], 
  function(err, results) {
    // results is now = [fileArray, ideaJSON, ideaFileName, hash]
    ideaJSON = results[1]
    ideaJSON.files = results [0]
    ideaJSON.hash = results[3]
    ideaJSON.ideaFileName = results[2]
    //TODO: add user auth token to ideaJSON
    console.log(ideaJSON)
    sendOut(ideaJSON)
  })

}) 

} 
