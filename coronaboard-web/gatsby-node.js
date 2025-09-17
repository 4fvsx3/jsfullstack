// ============================================
// gatsby-node.js
// Gatsby 빌드에서 필요한 데이터 소스를 불러오는 모듈
// ============================================

const { subDays } = require('date-fns'); // 날짜 계산 라이브러리
const { format, utcToZonedTime } = require('date-fns-tz'); // 타임존 처리
const _ = require('lodash'); // 유틸리티 라이브러리
const path = require('path'); // 절대 경로 처리
const fs = require('fs-extra'); // 파일 입출력 확장 라이브러리

// --------------------------------------------
// JSON 데이터 불러오기
// __dirname 기준 절대 경로로 불러오도록 수정
// --------------------------------------------
const countryInfo = require(path.join(__dirname, '../../tools/downloaded/countryInfo.json'));
const notice = require(path.join(__dirname, '../../tools/downloaded/notice.json'));

// API 클라이언트와 유튜브 함수
const ApiClient = require('./api-client');
const { getYouTubeVideosByKeyword } = require('./youtube');

// ============================================
// getDataSource: 모든 데이터 소스 가져오기
// ============================================
async function getDataSource() {
  // 국가 코드(cc)를 key로 변환
  const countryByCc = _.keyBy(countryInfo, 'cc');

  const apiClient = new ApiClient();

  // 전세계 통계 가져오기
  const allGlobalStats = await apiClient.getAllGlobalStats();
  const groupedByDate = _.groupBy(allGlobalStats, 'date');

  // 오늘/어제 통계 생성
  const globalStats = generateGlobalStats(groupedByDate);
  const globalChartDataByCc = generateGlobalChartDataByCc(groupedByDate);

  // 국가별 JSON 생성
  Object.keys(globalChartDataByCc).forEach((cc) => {
    const genPath = path.join(process.cwd(), `static/generated/${cc}.json`);
    fs.outputFileSync(genPath, JSON.stringify(globalChartDataByCc[cc]));
  });

  // 한국 관련 데이터
  const koreaTestChartData = generateKoreaTestChartData(allGlobalStats);
  const { byAge, bySex } = await apiClient.getByAgeAndBySex();

  // 유튜브 동영상 데이터
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
    const confirmedIncrement =
      countryData.confirmed - _.last(chartData.confirmedAcc) || 0;
    const deathIncrement = countryData.death - _.last(chartData.deathAcc) || 0;
    const releasedIncrement =
      countryData.released - _.last(chartData.releasedAcc) || 0;

    chartData.confirmed.push(confirmedIncrement);
    chartData.death.push(deathIncrement);
    chartData.released.push(releasedIncrement);
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
