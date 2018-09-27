
const chalk       = require('chalk');

// const assign = function(database, account, row) {
//     //Add transaction to object
//     obj.entries.push(row);
//     //Update database
//     dbCurrent.collection("terms").updateOne({
//         name: rootCol
//     }, {
//         $set: rootObj
//     }, {
//         upsert: true
//     }, function(err, res) {
//         if (err) throw err;
//         console.log(chalk.white("1 transaction keyed"));
//     });
//     //Delete From unassigned.
//     dbCurrent.collection("unassigned").deleteOne({
//         _id: row._id
//     }, function(err, res) {
//         if (err) throw err;
//         console.log(chalk.white(res));
//         console.log(chalk.white("1 unnassigned term removed."));
//         rootMenu(dbCurrent);
//     });
// }

const purge = function(dbCurrent) {
    let rootObj=[];
    let rootCol='';
    const purgeDown = function(obj) {

        if (obj.hasOwnProperty('subcategory')) {
            obj.subcategory.forEach(function(subcat){
                purgeDown(subcat);
            });
        } else {
            console.log(obj.entries.length + ' entries deleted');
            obj.entries=[];
            dbCurrent.collection("terms").updateOne({
                name: rootCol
            }, {
                $set: rootObj
            }, {
                upsert: true
            }, function(err, res) {
                if (err) throw err;
                //console.log(obj);
            });
        }
    }
    //resets everything
    //Reset terms but keep categories
    dbCurrent.collection("terms").find().toArray(function(err, doc) {
        if (err) throw err;
        //console.log(doc.length);
        doc.forEach(function(obj){
            //console.log(obj);
            rootObj = obj;
            rootCol=obj.name;
            purgeDown(obj)
        });
    });
    console.log(chalk.redBright('terms cleared'));

    dbCurrent.collection("unassigned").deleteMany();
    console.log(chalk.redBright('unassigned cleared'));

    dbCurrent.collection("readfiles").deleteMany();
    console.log(chalk.redBright('readfiles cleared'));
}

const add = function(dbCurrent, account, row){

    //let accountID='';

    new Promise(function(resolve, reject) {
        dbCurrent.collection(account).insertOne(row, function(err, docsInserted) {
            if (err) throw err;
            //console.log(docsInserted.ops[0]);
            resolve(docsInserted.ops[0]._id);
        });
    })
    .then(function(accountID) {
        let equityRow={
            type : row.type, 
            details : row.details,
            particulars : row.particulars, 
            code : row.code,
            reference : row.reference,
            amount : row.amount,
            date : row.date,
            foreignCurrencyAmount : row.foreignCurrencyAmount,
            conversionCharge : row.conversionCharge,
            linkCollection : account,
            link_id : accountID
        };
        return new Promise(function(resolve, reject){
            dbCurrent.collection('equity').insertOne(equityRow, function(err, docsInserted) {
            if (err) throw err;
            //console.log(docsInserted.ops[0]);
            //return array with this and previous IDs
            let returnObj={
                accountID:accountID,
                equityID:docsInserted.ops[0]._id
            }
            //console.log(returnObj);
            resolve(returnObj);
            });
        });
    })
    .then(function(returnObj) {
        console.log(returnObj);
        dbCurrent.collection(account).updateOne({ _id: returnObj.accountID }, { $set: {linkCollection: 'equity', link_id: returnObj.equityID }}, function(err, docsInserted) {
            if (err) throw err;
            console.log(docsInserted);
        });
        
    })
    .catch(function(err){throw err});



    // accountID=insertReturnID(account)
    // .then(function(){equityID=insertReturnID('equity')})
    // .then(function(){console.log(accountID + "   ,   " + equityID)});

    //console.log(accountID);
    //console.log(equityID);
    return

};



module.exports = {
    purge: purge,
    add:add
}