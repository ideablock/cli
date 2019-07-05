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

var fD = new FormData 
fD.append("api_token", 'H2qFayspDAmAyXOfmUlf0BjK3MgUWuHPu4Qa9JTACTgvtg0Oylv5Q5OreNLv') 
fetch('https://beta.ideablock.io/cli/get-parent-ideas', { method: 'post', body: fD})
.then(res => 
    res.json()
).then(
    json => console.log(json)
)


