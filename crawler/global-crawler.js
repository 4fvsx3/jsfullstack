const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');

const countryInfo = require('../tools/downloaded/countryInfo.json');

class GlobalCrawler{
    constructor(){
        this.client=axios.create({
            headers:{
                'User-Agent':
                'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36',
            },
        });
        this.countryMapping = _.chain(countryInfo)
            .keyBy('worldometer_title')
            .mapValues('cc')
            .value();
    }

    async crawlstat(){
        const url = 'https://www.worldometers.info/coronavirus/';
        const resp = await this.client.get(url);
        const $ = cheerio.load(resp.data);

        return this._extractStatByCountry($);
    }

    _extractStatByCountry($){
        const colnames = $('#main_table_countries_today thead tr th')
            .map((i,th) => {
                return $(th).text().trim();
            })
            .toArray();

        const rows=[];
        $('#main_table_countries_today tbody tr').each((i,tr)=>{
            const row = $(tr)
                .find('td')
                .map((j,td)=>{
                    return $(td).text().trim();
                })
                .toArray();
            rows.push(row);
        })

        if(rows.length === 0){
            throw new Error(
                'country rows not fount.Site layout may have been changed',
            );
        }

        const colNameToFieldMapping = {
            'Country,Other':'title',
            TotalCases: 'confirmed',
            TotalDeaths:'death',
            TotalRecovered: 'released',
            TotalTest:'tested',
        };

        const normalizedData=rows
            .map((row)=>{
                const countryStat={};
                for(let i=0; i<colnames.length;i++){
                    const colName=colnames[i]
                    const fieldName = colNameToFieldMapping[colName];

                    if(!fieldName){
                        continue;
                    }
                    const numberFields=['confirmed','death','released','tested'];

                    if(numberFields.includes(fieldName)){
                        countryStat[fieldName] = this._normalize(row[i]);
                    }else{
                        countryStat[fieldName] = row[i];
                    }
                }
                return countryStat;
            })
            .filter((countryStat) => this.countryMapping[countryStat.title])
            .map((countryStat)=>({
                ...countryStat,
                cc:this.countryMapping[countryStat.title],
            }));
        return _.keyBy(normalizedData,'cc');
    }

    _normalize(numberText) {
        return parseInt(numberText.replace(/[\s,]*/g, '')) || 0;
    }

}

module.exports = GlobalCrawler
