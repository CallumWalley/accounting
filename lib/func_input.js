var fs = require('fs');
var config = require('.././config.json');
var CsvReadableStream = require('csv-reader');
const chalk       = require('chalk');


var MongoClient = require('mongodb').MongoClient;
mongoUrl = "mongodb://localhost:27017/tycho";


//Need to check if nowaccount is clean.
let nowAccount='tycho';

//var db = new sqlite3.Database('./' + nowAccount + '/database.db');
directory='./' + nowAccount + '/';

let rowIndex = 0;

let excelMap=[
{type: 'varchar', inColIndex:0, name:'type'},
{type: 'varchar', inColIndex:1, name:'details'},
{type: 'varchar', inColIndex:2, name:'particulars'},
{type: 'varchar', inColIndex:3, name:'code'},
{type: 'varchar', inColIndex:4, name:'reference'},
{type: 'double', inColIndex:5, name:'amount'},
{type: 'datetime', inColIndex:6, name:'date'},
{type: 'varchar', inColIndex:7, name:'foreignCurrencyAmount'},
{type: 'varchar', inColIndex:8, name:'conversionCharge'}
];
 //type, details, particulars, code, reference, amount, date, cat, subcat, pending, fromsheet, foreignCurrencyAmount, conversionCharge, tags, data) VALUES(


    const fileImport = async function(dbCurrent){
        return new Promise(function(resolve, reject){
        fs.readdir( directory, function(error, files){

            let outObject = [];
            let addedLines = 0;

            //Check each file in directory
            console.log(chalk.white(0 + " / " + files.length + " files read."));
            var fileCheck = new Promise(function(resolve, reject){
                files.forEach( function( file, index, files ) {
                //if file not csv skip.
                if(file.substr(file.length-4)!=='.csv'){
                    console.log(chalk.white(file + " skipped, not csv."));
                }
                else{
                    //if filename in metadata skip.
                    let doesExist = true;
                    dbCurrent.collection("readfiles").findOne({name : (file)}, function(err, result) {
                        if (err) throw err;          
                        if (result == null){                       
                                //if filename NOT in metadata.
                                    var inputStream = fs.createReadStream(directory+file, {encoding : 'utf8'});
            
                                    let maxDate = 0;
                                    let minDate = 99999999999999999999999999;
            
                                    inputStream
                                        .pipe(CsvReadableStream())
                                        .on('data', function (row, index) {
            
                                            //console.log(row);
                                            rowObject={};
                                            excelMap.forEach(function(map){
                                                rowObject[map.name]=row[map.inColIndex];                                                                        
                                            })
            
                                            rowDate = dateCheck(rowObject.date);
            
                                            if (maxDate<rowDate){
                                                maxDate=rowDate;
                                            }
                                            if (minDate>rowDate){
                                                minDate=rowDate;
                                            }
                                            
            
                                            dbCurrent.collection("unassigned").insertOne(rowObject, function(err, res) {
                                                    if (err) throw err;
                                            });
                                                addedLines += 1;          
                                                console.log(chalk.white(addedLines + ' transactions added.'));
                                        })
                                        .on('end', function (data) {
                                            var newObj = { name: file, startDate : minDate, endDate : maxDate};
                                            dbCurrent.collection("readfiles").insertOne(newObj, function(err, res) {
                                                if (err) throw err;
                                                console.log(chalk.white("Filemeta updated"));
                                            });
                                        });
                                        
                                    
                        }else{
                            console.log(chalk.white(file + " skipped, already read."));
                        }
                        console.log(chalk.white(index+1 + " / " + files.length + " files read."));
                        if (index === files.length -1) resolve();
            
                            
                           
                        });
                }
                });
            });


            fileCheck.then(function(){
                console.log(chalk.green("Done!"));
                resolve();
            });

        });
        
    });
}
        


function stringCheck(instring){
    if(instring !== undefined && instring.length > 0){
        outstring=encodeURI(instring);
        if (outstring.length > 254){
            outstring.substring(0, 255);
        }
        return `'` + outstring + `'`;
    }   
    return false;
}
function numberCheck(inNum){
    return inNum;
}
function dateCheck(inDate){
    //console.log(inDate);
    var datArray = inDate.split("/");
    var dt = new Date(parseInt(datArray[2], 10),
                    parseInt(datArray[1], 10) - 1,
                    parseInt(datArray[0], 10));
    //console.log(dt.toString());

    // if  (dt.toString() == 'Invalid Date'){
    //     //console.log('Invalid Date');
    //    return false
    // }
    // isodate=dt.toISOString();
    return dt;
}
module.exports = {
    fileImport:fileImport,
}
    

   