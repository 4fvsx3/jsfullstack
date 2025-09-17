import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { css } from '@emotion/react';
import { Dashboard } from '../components/dashboard';
import { Notice } from '../components/notice';
import { Navigation } from '../components/navigation';
import { GlobalSlide } from '../components/global-slide';
import { GlobalChartSlide } from '../components/global-chart-slide';
import { KoreaChartSlide } from '../components/korea-chart-slide';
import { Footer } from '../components/footer';
import { YoutubeSlide } from '../components/youtube-slide';
import HelmetWrapper from '../components/helmet-wrapper';

export default function SinglePage({ pageContext }) {
  const { dataSource } = pageContext || {};
  const {
    lastUpdated = null,
    globalStats = {},
    notice = {},
  } = dataSource || {}; // dataSource가 null이면 기본값 사용

  const lastUpdatedFormatted = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : '데이터 없음';

  return (
    <div id="top">
      <HelmetWrapper title={'홈'} />
      {/* 상단 검은색 배경 만들기 */}
      <div
        css={css`
          position: absolute;
          background-color: black;
          width: 100%;
          height: 300px;
          z-index: -99;
        `}
      />

      <h1
        css={css`
          padding-top: 48px;
          padding-bottom: 24px;
          color: red;
          text-align: center;
          font-size: 28px;
        `}
      >
        COVID-19
        <br />
        통계판 만들어 보기
      </h1>

      <p className="text-center text-white">
        마지막 업데이트: {lastUpdatedFormatted}
      </p>

      {/* 데이터가 없으면 빈 객체로 보내서 Dashboard와 Notice도 에러 방지 */}
      <Dashboard globalStats={globalStats} />
      <Notice notice={notice} />

      <div
        css={css`
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        `}
      ></div>

      <Navigation />

      <GlobalSlide id="global-slide" dataSource={dataSource || {}} />

      <iframe
        src="https://ads-partners.coupang.com/widgets.html?id=637932&template=carousel&trackingCode=AF0322893&subId=&width=100%25&height=200"
        width="100%"
        height="200"
        frameBorder="0"
        scrolling="no"
        referrerPolicy="unsafe-url"
      ></iframe>

      <GlobalChartSlide id="global-chart-slide" dataSource={dataSource || {}} />

      <div
        css={css`
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        `}
      ></div>

      <KoreaChartSlide id="korea-chart-slide" dataSource={dataSource || {}} />
      <YoutubeSlide id="youtube-slide" dataSource={dataSource || {}} />

      <Footer />
    </div>
  );
}
