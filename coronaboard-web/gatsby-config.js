module.exports = {
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
  ],
  siteMetadata: {
    siteUrl: 'https://davidshim.kr',
    title: '통계표 테스팅(COVID)',
    description:
      '다양한 최신 기술들을 공부하기 위해, 기존 웹개발자가 연습한 페이지(coronaboard.kr)',
    image: 'https://coronaboard.kr/ogimage.png',
  },
};
