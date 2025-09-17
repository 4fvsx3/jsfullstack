module.exports = {
  siteMetadata: {
    siteUrl: 'https://davidshim.kr',
    title: '통계 테스팅',
    description:
      '최신기술들을 공부하기 위해 js로만 fullstacking 하는 coronaboard.kr을 복제해봄',
    image: 'src/static/red heart.png', // OG 이미지
  },
  plugins: [
    'gatsby-plugin-emotion',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-google-tagmanager',
      options: {
        id: 'GTM-TDN8Q6QJ',
        includeInDevelopment: false,
        defaultDataLayer: {
          platform: 'gatsby',
        },
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: '통계 테스팅',
        short_name: '테스팅',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        display: 'standalone',
        icon: 'src/static/red heart.png', // 브라우저 탭(Favicon)용 아이콘
      },
    },
  ],
};
