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
  if (!dataSource) return <div>오늘 데이터가 없습니다.</div>;

  const { lastUpdated, globalStats, notice } = dataSource;
  const lastUpdatedFormatted = new Date(lastUpdated).toLocaleString();

  return (
    <div id="top">
      <HelmetWrapper title={"Home"} />
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
        실시간 통계표 테스팅
        <br />
        (COVID-19)
      </h1>
      <p className="text-center text-white">
        마지막 업데이트: {lastUpdatedFormatted}
      </p>

      <Dashboard globalStats={globalStats} />
      <Notice notice={notice} />
      <Navigation />
      <GlobalSlide id="global-slide" dataSource={dataSource} />
      <GlobalChartSlide id="global-chart-slide" dataSource={dataSource} />
      <KoreaChartSlide id="korea-chart-slide" dataSource={dataSource} />
      <YoutubeSlide id="youtube-slide" dataSource={dataSource} />
      <Footer />
    </div>
  );
}
