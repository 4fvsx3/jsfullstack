const { subDays } = require('date-fns');
const { format, utcToZonedTime } = require('date-fns-tz');
const _ = require('lodash');

const countryInfo = require('../../tools/downloaded/countryInfo.json');
const ApiClient = require('./api-client');
const notice = require('../../tools/downloaded/notice.json');

const path = require('path');
const fs = require('fs-extra');

const { getYouTubeVideosByKeyword } = require('./youtube');

async function getDataSource() {
  const countryByCc = _.keyBy(countryInfo, 'cc');
  const apiClient = new ApiClient();

  // API 호출
  const allGlobalStats = await apiClient.getAllGlobalStats();
  const groupedByDate = _.groupBy(allGlobalStats, 'date');

  const globalChartDataByCc = generateGlobalChartDataByCc(groupedByDate);

  // static/generated 디렉터리에 각 국가별 JSON 비동기 저장
  await Promise.all(
    Object.keys(globalChartDataByCc).map(async (cc) => {
      const genPath = path.join(process.cwd(), `static/generated/${cc}.json`);
      await fs.outputFile(genPath, JSON.stringify(globalChartDataByCc[cc]));
    })
  );

  const koreaTestChartData = generateKoreaTestChartData(allGlobalStats);
  const { byAge, bySex } = await apiClient.getByAgeAndBySex();
  const youtubeVideos = await getYouTubeVideosByKeyword('코로나19');

  Object.keys(globalChartDataByCc).forEach((cc) => {
    if (!countryByCc[cc]) return;
    countryByCc[cc].chartData = globalChartDataByCc[cc];
  });

  let todayStats;
  const now = new Date();
  const timeZone = 'Asia/Seoul';
  const todayStr = format(utcToZonedTime(now, timeZone), 'yyyy-MM-dd');
  const yesterdayStr = format(utcToZonedTime(subDays(now, 1), timeZone), 'yyyy-MM-dd');

  if (groupedByDate[todayStr]) {
    todayStats = createGlobalStatWithPrevField(
      groupedByDate[todayStr],
      groupedByDate[yesterdayStr]
    );
  } else {
    todayStats = createGlobalStatWithPrevField(
      groupedByDate[yesterdayStr],
      groupedByDate[subDays(now, 2)]
    );
  }

  return {
    lastUpdated: Date.now(),
    globalStats: todayStats,
    countryByCc,
    notice: notice.filter((x) => !x.hidden),
    koreaTestChartData,
    koreaBySexChartData: bySex,
    koreaByAgeChartData: byAge,
    youtubeVideos,
  };
}

// 마지막 사용 가능한 데이터 가져오기
async function getLastAvailableData() {
  const filePath = path.join(process.cwd(), 'static/generated/global.json');
  if (await fs.pathExists(filePath)) {
    const data = await fs.readJson(filePath);
    data.globalStats = data.globalStats || [];
    return data;
  }
  return { globalStats: [] }; // 항상 배열
}

function generateKoreaTestChartData(allGlobalStats) {
  const krData = allGlobalStats.filter((x) => x.cc === 'KR');
  return {
    date: krData.map((x) => x.date),
    confirmedRate: krData.map((x) => x.confirmed / (x.confirmed + x.negative)),
    confirmed: krData.map((x) => x.confirmed),
    negative: krData.map((x) => x.negative),
    testing: krData.map((x) => x.testing),
  };
}

function createGlobalStatWithPrevField(todayStats, yesterdayStats) {
  const yesterdayStatsByCc = _.keyBy(yesterdayStats, 'cc');
  return todayStats.map((todayStat) => {
    const cc = todayStat.cc;
    const yesterdayStat = yesterdayStatsByCc[cc];
    if (yesterdayStat) {
      return {
        ...todayStat,
        confirmedPrev: yesterdayStat.confirmed || 0,
        deathPrev: yesterdayStat.death || 0,
        negativePrev: yesterdayStat.negative || 0,
        releasedPrev: yesterdayStat.released || 0,
        testedPrev: yesterdayStat.tested || 0,
      };
    }
    return todayStat;
  });
}

function generateGlobalChartDataByCc(groupedByDate) {
  const chartDataByCc = {};
  const dates = Object.keys(groupedByDate).sort();
  for (const date of dates) {
    const countriesDataForOneDay = groupedByDate[date];

    for (const countryData of countriesDataForOneDay) {
      const cc = countryData.cc;
      if (!chartDataByCc[cc]) {
        chartDataByCc[cc] = {
          date: [],
          confirmed: [],
          confirmedAcc: [],
          death: [],
          deathAcc: [],
          released: [],
          releasedAcc: [],
        };
      }
      appendToChartData(chartDataByCc[cc], countryData, date);
    }

    if (!chartDataByCc['global']) {
      chartDataByCc['global'] = {
        date: [],
        confirmed: [],
        confirmedAcc: [],
        death: [],
        deathAcc: [],
        released: [],
        releasedAcc: [],
      };
    }

    const countryDataSum = countriesDataForOneDay.reduce(
      (sum, x) => ({
        confirmed: sum.confirmed + x.confirmed,
        death: sum.death + x.death,
        released: sum.released + (x.released || 0),
      }),
      { confirmed: 0, death: 0, released: 0 }
    );

    appendToChartData(chartDataByCc['global'], countryDataSum, date);
  }

  return chartDataByCc;
}

function appendToChartData(chartData, countryData, date) {
  if (chartData.date.length === 0) {
    chartData.confirmed.push(countryData.confirmed);
    chartData.death.push(countryData.death);
    chartData.released.push(countryData.released);
  } else {
    chartData.confirmed.push(countryData.confirmed - (_.last(chartData.confirmedAcc) || 0));
    chartData.death.push(countryData.death - (_.last(chartData.deathAcc) || 0));
    chartData.released.push(countryData.released - (_.last(chartData.releasedAcc) || 0));
  }

  chartData.confirmedAcc.push(countryData.confirmed);
  chartData.deathAcc.push(countryData.death);
  chartData.releasedAcc.push(countryData.released);
  chartData.date.push(date);
}

module.exports = {
  getDataSource,
  getLastAvailableData,
};
