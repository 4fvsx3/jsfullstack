const { getDataSource } = require('./src/data-loader');

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    dataSource = await getDataSource();
  } catch (err) {
    console.warn('오늘 데이터가 없어서 기본 데이터를 사용합니다.');
    dataSource = null; // 또는 빈 객체 {} 가능
  }

  createPage({
    path: '/',
    component: require.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
