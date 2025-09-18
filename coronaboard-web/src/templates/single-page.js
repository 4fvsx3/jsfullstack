import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { css } from "@emotion/react";
import { Dashboard } from "../components/dashboard";
import { Notice } from "../components/notice";
import { Navigation } from "../components/navigation";
import { GlobalSlide } from "../components/global-slide";
import { GlobalChartSlide } from "../components/global-chart-slide";
import { KoreaChartSlide } from "../components/korea-chart-slide";
import { Footer } from "../components/footer";
import { YoutubeSlide } from "../components/youtube-slide";
import HelmetWrapper from "../components/helmet-wrapper";

export default function SinglePage({ pageContext }) {
  // null-safe 기본값
  const {
    dataSource = {
      lastUpdated: null,
      globalStats: {},
      notice: null,
    },
  } = pageContext || {};

  const { lastUpdated, globalStats, notice } = dataSource;
  const lastUpdatedFormatted = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "데이터 없음";

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

      {/* 데이터 없을 때도 안전하게 */}
      <Dashboard globalStats={globalStats || {}} />
      <Notice notice={notice || ""} />

      <Navigation />

      <GlobalSlide id="global-slide" dataSource={dataSource} />

      <iframe
        src="https://ads-partners.coupang.com/widgets.html?id=637932&template=carousel&trackingCode=AF0322893&subId=&width=100%25&height=200"
        width="100%"
        height="200"
        frameBorder="0"
        scrolling="no"
        referrerPolicy="unsafe-url"
      ></iframe>

      <GlobalChartSlide id="global-chart-slide" dataSource={dataSource} />
      <KoreaChartSlide id="korea-chart-slide" dataSource={dataSource} />
      <YoutubeSlide id="youtube-slide" dataSource={dataSource} />

      <Footer />
    </div>
  );
}
