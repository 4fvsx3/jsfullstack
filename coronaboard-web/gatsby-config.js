module.exports = {
  siteMetadata: {
    siteUrl: 'https://davidshim.kr',
    title: '통계표 테스팅(COVID)',
    description:
      '다양한 최신 기술들을 공부하기 위해, 기존 웹개발자가 연습한 페이지(coronaboard.kr)',
    image: '/redheart.png', // SNS/SEO 공유용
  },
  plugins: [
    'gatsby-plugin-emotion',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-google-tagmanager',
      options: {
        id: 'GTM-5CFLPPP',
        includeInDevelopment: false,
        defaultDataLayer: {
          platform: 'gatsby',
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `통계표 테스팅(COVID)`,
        short_name: `COVID`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `standalone`,
        icon: `static/redheart.png`, // static 폴더 안에 아이콘 넣기
      },
    },
  ],
};
