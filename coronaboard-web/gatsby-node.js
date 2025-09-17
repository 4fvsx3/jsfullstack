const { getDataSource } = require('./src/data-loader');

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    // 데이터 가져오기
    dataSource = await getDataSource();
  } catch (err) {
    console.warn('오늘 데이터가 없어서 기본 데이터를 사용합니다.');
    // 오늘 데이터 없으면 빈 배열로 초기화
    dataSource = {
      globalStats: [],
      countryStats: [],
    };
  }

  createPage({
    path: '/',
    component: require.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
