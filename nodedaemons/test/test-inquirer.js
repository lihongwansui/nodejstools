var inquirer = require('inquirer');

inquirer
  .prompt([
    {type: 'confirm', name: "isProcess", message: "who is this?"}
  ])
  .then(answers => {
    console.log(answers.isProcess === true);
    
  });

// var prompt = inquirer.createPromptModule();

// prompt("Please input y or n").then(/* ... */);