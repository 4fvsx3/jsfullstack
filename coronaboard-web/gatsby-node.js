// ============================================
// gatsby-node.js
// ============================================
const { getDataSource } = require('./src/data-loader');

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    dataSource = await getDataSource();
  } catch (err) {
    console.warn('⚠️ 오늘 데이터가 없어서 기본 데이터를 사용합니다.');
    // 빈 객체로 초기화
    dataSource = {
      lastUpdated: Date.now(),
      globalStats: [],
      countryByCc: {},
      notice: [],
      koreaTestChartData: {},
      koreaBySexChartData: {},
      koreaByAgeChartData: {},
      youtubeVideos: [],
    };
  }

  createPage({
    path: '/',
    component: require.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
