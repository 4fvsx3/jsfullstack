const _ =require('lodash');
const fs = require('fs');
const path = require('path');
const { format,utcToZonedTime } = require('date-fns-tz');
const GlobalCrawler = require('./global-crawler');

async function crawlAndUpdateGlobal(outputPath,apiClient){
    let prevData = {};
    const globalStatPath = path.join(outputPath,'global-stat.json');
    try{
        prevData = JSON.parse(fs.readFileSync(globalStatPath,'utf-8'));
    }catch(e){
        console.log('previous globalStat not found');
    }

    const globalCrawler = new GlobalCrawler();

    const now = new Date();
    const timeZone = 'Asia/Seoul';
    const crawledDate = format(utcToZonedTime(now,timeZone),'yyyy-MM-dd');

    const newData = {
        crawledDate,
        globalStat: await globalCrawler.crawlstat()
    };
    
    if(_.isEqual(newData,prevData)){
        console.log('globalStat has not been changed');
        return;
    }

    fs.writeFileSync(globalStatPath,JSON.stringify(newData));

    const newGlobalStat = newData.globalStat

    const resp = await apiClient.findAllGlobalStat();
    const oldRows = resp.result.filter((x) => x.date === crawledDate);
    const oldGlobalStat = _.keyBy(oldRows, 'cc');

    const updatedRows = findUpdatedRows(newGlobalStat,oldGlobalStat);
    if(_.isEmpty(updatedRows)){
        console.log('No updated globalStat rows');
        return;
    }

    for (const row of updatedRows){
        await apiClient.upsertGlobalStat({
            date: crawledDate,
            ...row,
        });
    }

    console.log('globalStat updated successfully');
}

function findUpdatedRows(newRowsByCc,oldRowsByCc){
  const updatedRows = [];
    for(const cc of Object.keys(newRowsByCc)){
        const newRow = newRowsByCc[cc];
        const oldRow = oldRowsByCc[cc];


        if(isRowEqual(newRow,oldRow)){
            continue;
        }

        updatedRows.push(newRow);
    }   
    return updatedRows;
}


function isRowEqual(newRow,prevRow){
    const colsToCompare = [
        'confirmed',
        'death',
        'released',
        'critical',
        'tested',
    ];

    if (!prevRow){
        return false;
    }
    return colsToCompare.every((col)=>newRow[col] === prevRow[col]);
}

module.exports = { crawlAndUpdateGlobal };
