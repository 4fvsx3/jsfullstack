// ============================================
// gatsby-node.js
// Gatsby 빌드에서 필요한 데이터 소스를 불러오는 모듈
// 파일이 없으면 경고만 출력하고 계속 진행
// ============================================

const { subDays } = require('date-fns'); // 날짜 계산
const { format, utcToZonedTime } = require('date-fns-tz'); // 타임존 처리
const _ = require('lodash'); // 유틸리티
const path = require('path');
const fs = require('fs-extra');

// --------------------------------------------
// JSON 데이터 불러오기 (없으면 경고 처리)
// --------------------------------------------
let countryInfo = [];
let notice = [];

try {
  countryInfo = require(path.join(__dirname, '../../tools/downloaded/countryInfo.json'));
} catch (err) {
  console.warn("⚠️ countryInfo.json 파일을 찾을 수 없습니다. 국가 관련 기능은 일부 제한됩니다.");
}

try {
  notice = require(path.join(__dirname, '../../tools/downloaded/notice.json'));
} catch (err) {
  console.warn("⚠️ notice.json 파일을 찾을 수 없습니다. 공지 기능은 일부 제한됩니다.");
}

// API 클라이언트와 유튜브 함수
const ApiClient = require('./api-client');
const { getYouTubeVideosByKeyword } = require('./youtube');

// ============================================
// getDataSource: 모든 데이터 소스 가져오기
// ============================================
async function getDataSource() {
  const countryByCc = _.keyBy(countryInfo, 'cc');

  const apiClient = new ApiClient();

  // 전세계 통계 가져오기
  const allGlobalStats = await apiClient.getAllGlobalStats();
  const groupedByDate = _.groupBy(allGlobalStats, 'date');

  const globalStats = generateGlobalStats(groupedByDate);
  const globalChartDataByCc = generateGlobalChartDataByCc(groupedByDate);

  // 국가별 JSON 저장
  Object.keys(globalChartDataByCc).forEach((cc) => {
    const genPath = path.join(process.cwd(), `static/generated/${cc}.json`);
    fs.outputFileSync(genPath, JSON.stringify(globalChartDataByCc[cc]));
  });

  const koreaTestChartData = generateKoreaTestChartData(allGlobalStats);

  const { byAge, bySex } = await apiClient.getByAgeAndBySex();
  const youtubeVideos = await getYouTubeVideosByKeyword('코로나19');

  return {
    lastUpdated: Date.now(),
    globalStats,
    countryByCc,
    notice: notice.filter((x) => !x.hidden),
    koreaTestChartData,
    koreaBySexChartData: bySex,
    koreaByAgeChartData: byAge,
    youtubeVideos,
  };
}

// ============================================
// generateKoreaTestChartData: 한국 테스트 데이터 생성
// ============================================
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

// ============================================
// generateGlobalStats: 오늘/어제 글로벌 통계 생성
// 오늘 데이터가 없으면 빈 배열로 처리
// ============================================
function generateGlobalStats(groupedByDate) {
  const now = new Date();
  const timeZone = 'Asia/Seoul';

  const today = format(utcToZonedTime(now, timeZone), 'yyyy-MM-dd');
  const yesterday = format(utcToZonedTime(subDays(now, 1), timeZone), 'yyyy-MM-dd');

  const todayStats = groupedByDate[today] || [];
  const yesterdayStats = groupedByDate[yesterday] || [];

  if (todayStats.length === 0) {
    console.warn("⚠️ 오늘 데이터가 없습니다. 빈 배열로 처리합니다.");
  }

  return createGlobalStatWithPrevField(todayStats, yesterdayStats);
}

// ============================================
// createGlobalStatWithPrevField: 어제 대비 필드 추가
// ============================================
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

    return {
      ...todayStat,
      confirmedPrev: 0,
      deathPrev: 0,
      negativePrev: 0,
      releasedPrev: 0,
      testedPrev: 0,
    };
  });
}

// ============================================
// generateGlobalChartDataByCc: 국가별 차트 데이터 생성
// ============================================
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

    // 글로벌 합계
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
      { confirmed: 0, death: 0, released: 0 },
    );

    appendToChartData(chartDataByCc['global'], countryDataSum, date);
  }

  return chartDataByCc;
}

// ============================================
// appendToChartData: 차트 데이터 누적 처리
// ============================================
function appendToChartData(chartData, countryData, date) {
  if (chartData.date.length === 0) {
    chartData.confirmed.push(countryData.confirmed);
    chartData.death.push(countryData.death);
    chartData.released.push(countryData.released);
  } else {
    chartData.confirmed.push(countryData.confirmed - _.last(chartData.confirmedAcc) || 0);
    chartData.death.push(countryData.death - _.last(chartData.deathAcc) || 0);
    chartData.released.push(countryData.released - _.last(chartData.releasedAcc) || 0);
  }

  chartData.confirmedAcc.push(countryData.confirmed);
  chartData.deathAcc.push(countryData.death);
  chartData.releasedAcc.push(countryData.released);
  chartData.date.push(date);
}

// ============================================
// 모듈 export
// ============================================
module.exports = {
  getDataSource,
};
