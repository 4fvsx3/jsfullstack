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
    title: '통계 테스팅',
    description:
      '최신기술들을 공부하기 위해 js로만 fullstacking 하는 coronaboard.kr을 복제해봄',
    image: 'https://coronaboard.kr/ogimage.png',
  },
};
