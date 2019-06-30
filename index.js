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
const questions = [{
  type: 'input',
  name:'first',
  message: 'What is your first name?'
},
{
  type: 'input',
  name:'last',
  message: 'What is your last name?'
}]
//let ideaJSON = {}
inquirer.prompt(questions)
.then(answers => {
  console.log(answers)
})
