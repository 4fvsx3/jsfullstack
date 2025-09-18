const path = require("path");
const { getDataSource } = require("./src/lib/data");

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  let dataSource = null;
  try {
    dataSource = await getDataSource();
  } catch (err) {
    console.warn("getDataSource() failed:", err.message);
  }

  if (!dataSource) {
    console.warn("No data available for today, building with fallback.");
  }

  createPage({
    path: "/",
    component: path.resolve(`src/templates/single-page.js`),
    context: { dataSource },
  });
};
