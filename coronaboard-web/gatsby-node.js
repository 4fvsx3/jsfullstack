const { getDataSource } = require('./src/data-loader');

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    dataSource = await getDataSource(); // 오늘 데이터 가져오기 시도
  } catch (err) {
    console.warn('오늘 데이터가 없어서 기본 데이터를 사용합니다.');
    dataSource = {
      globalStats: [],    // 필요한 기본 구조
      countryStats: [],   // 필요한 기본 구조
    };
  }

  createPage({
    path: '/',
    component: require.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
