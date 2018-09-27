const inquirer = require('inquirer');
const files = require('./files');
const func_input = require('./func_input');
const func_database = require('./func_database');
var MongoClient = require('mongodb').MongoClient;



const readline    = require('readline');
const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');



const rootMenu = function(dbCurrent) {
const printRow = function(row){
    //prints row details to console
    console.log(chalk.redBright("----" + row.type + ", " + row.details + ", " + row.particulars + ", " + row.code + ", " + row.reference + ", $" + row.amount + ", " + row.date + "----"));
}
const parentCategory = function(row) {
    let rootObj = [];
    let rootCol = '';
    //If new category required
    const getTerm = function(obj) {
        //header();
        console.log(obj);
        let questions = [
        {
            type: 'input',
            name: 'name',
            message: "Enter new category name."
        },
        {
            type: 'confirm',
            name: 'terminal',
            message: "Is this a terminal category?"
        }
        ]
        inquirer
        .prompt(questions)
        .then(function(answer) {
            confirm('Are you sure you want to add this category?').then(function(confirmed){
                if (confirmed){
                    console.log(chalk.white('adding'));
                    if (answer.terminal){
                        obj.subcategory.push({name:answer.name, entries:[]});
                    }else{
                        obj.subcategory.push({name:answer.name, subcategory:[]});
                    }
                    console.log(answer);
                    down(obj);
    
                }else{
                    console.log(chalk.white('not adding'));
                    rootMenu(dbCurrent);
                }
            })
        });
    }
    //Recursively navigate down tree
const down = function(obj) {
    if (obj.hasOwnProperty('subcategory')) {
        let options = Array.from(obj.subcategory);
        options.push({
            name: 'add category'
        });
        //header();
        inquirer
            .prompt({
                name: 'selected',
                type: 'list',
                message: 'Select Category',
                choices: options
            })
            .then(function(answer) {
                if (answer.selected == "add category") {
                    //add cat and call again.
                    getTerm(obj);
                    //console.log(chalk.white('Add'));
                    return
                } else {
                    //call again
                    down(obj.subcategory.find(function(thob) {
                        return thob.name === answer.selected;
                    }));
                }
            });
    } else {
        assign(obj);
    }
}
//Action once key is determined
const assign = function(obj) {
    //Add transaction to object
    obj.entries.push(row);
    //Update database
    dbCurrent.collection("terms").updateOne({
        name: rootCol
    }, {
        $set: rootObj
    }, {
        upsert: true
    }, function(err, res) {
        if (err) throw err;
        console.log(chalk.white("1 transaction keyed"));
    });
    //add to appropriate accounts;
    func_database.add(dbCurrent, 'expenses', row);
    //Delete From unassigned.
    dbCurrent.collection("unassigned").deleteOne({
        _id: row._id
    }, function(err, res) {
        if (err) throw err;
        console.log(chalk.white(res));
        console.log(chalk.white("1 unnassigned term removed."));
        //rootMenu(dbCurrent);
    });
}

    header();
    printRow(row);

    inquirer
        .prompt({
            name: 'selected',
            type: 'list',
            message: 'Select Top Level Category',
            choices() {
                return new Promise(function(resolve, reject) {
                    dbCurrent.collection("terms").find().toArray(function(err, cats) {
                        if (err) throw err;
                        resolve(cats);
                    });
                });
            }
        })
        .then(function(answer) {
            rootCol = answer.selected;

            dbCurrent.collection("terms").findOne({
                name: answer.selected
            }, function(err, obj) {
                rootObj = obj;
                down(obj);
            });
        })
            //printRow(row);


}

const header = function(){
    clear();
    console.log(chalk.redBright(figlet.textSync('TYCHO', { font: 'big', horizontalLayout: 'full' })));
    console.log(chalk.redBright('========================================================\n\n'));
}
const confirm = function(message){
    return new Promise(function(resolve, reject) {
    inquirer
    .prompt({
        type: 'confirm',
        name: 'confirm',
        message: message
    })
    .then(function(answer){
        //console.log(answer.confirm);
        resolve(answer.confirm);
    })
});
}
const pressToReturn = function(){
    confirm('Return to root menu?').then(function(confirmed){
        if (confirmed){
            rootMenu(dbCurrent);
        }else{
            rootMenu(dbCurrent);
        }
    });

}
    header();
    inquirer
        .prompt({
            name: 'operation',
            type: 'list',
            message: 'Select Operation\n',
            choices: ['Import new CSV.', 'Validate term.','Purge.', 'Quit.']
        })
        .then(function(value) {
            switch (value.operation) {
                case ('Import new CSV.'):
                    header();
                    func_input.fileImport(dbCurrent).then(function(){pressToReturn()});
                    break
                case ('Validate term.'):
                    header();
                    dbCurrent.collection("unassigned").find().toArray(function(err, results) {
                        if (err) throw err;
                        if (results.length < 1){
                            console.log('No unassigned transactions.');
                            pressToReturn();

                        }else{
                            parentCategory(dbCurrent, results[0]);
                        }
                    });

                    break
                case ('Purge.'):
                    //confirm('Are you sure, this will wipe all data. (Terms and .csv unaffected)').then(
                    func_database.purge(dbCurrent).then(function(){pressToReturn()});
                    //);
                    break
                case ('Quit.'):
                    //quit
                    process.stdin.setRawMode(true)
                    console.log(chalk.white('BYE!!'));
                    process.exit(0);
                    break
                default:
                    break
            }
            // if (!exit){
            //     rootMenu(dbCurrent);
            // }
            return
        });
        
};

module.exports = {
    rootMenu: rootMenu,
    // parentCategory: parentCategory,
    // confirm: confirm,
    // header: header

}