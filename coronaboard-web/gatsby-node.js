const { getDataSource } = require('./src/data-loader');
const path = require('path');

exports.createPages = async ({ actions, reporter }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    dataSource = await getDataSource();
  } catch (err) {
    reporter.warn(`getDataSource() failed: ${err.message}`);
    dataSource = null;
  }

  if (!dataSource) {
    reporter.warn("No data available for today, building with fallback.");
  }

  createPage({
    path: '/',
    component: path.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
