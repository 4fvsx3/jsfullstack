const { getDataSource, getLastAvailableData } = require('./src/data-loader');
const path = require('path');

exports.createPages = async ({ actions, reporter }) => {
  const { createPage } = actions;

  let dataSource;
  try {
    dataSource = await getDataSource();
    if (!dataSource) {
      reporter.warn("Today's data is missing. Using last available data for build.");
      dataSource = await getLastAvailableData();
    }
  } catch (err) {
    reporter.warn(`Error getting data: ${err.message}. Using last available data.`);
    dataSource = await getLastAvailableData();
  }

  if (!dataSource) {
    reporter.panic("No available data for build. Build cannot proceed.");
  }

  console.log('dataSource in createPages:', dataSource);

  createPage({
    path: '/',
    component: path.resolve('./src/templates/single-page.js'),
    context: { dataSource },
  });
};
