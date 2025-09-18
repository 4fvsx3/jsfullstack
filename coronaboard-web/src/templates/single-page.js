import React from "react";

export default function SinglePage({ pageContext }) {
  const { dataSource } = pageContext || {};

  // null-safe 처리
  if (!dataSource) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>데이터 없음</h1>
        <p>현재 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { lastUpdated, globalStats, notice } = dataSource;

  const lastUpdatedFormatted = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "알 수 없음";

  return (
    <div style={{ padding: "2rem" }}>
      <h1>업데이트 시각: {lastUpdatedFormatted}</h1>

      {notice && <p>공지: {notice}</p>}

      {globalStats ? (
        <div>
          <p>확진자 수: {globalStats.worldConfirmed}</p>
          <p>사망자 수: {globalStats.worldDeath}</p>
          <p>회복자 수: {globalStats.worldReleased}</p>
        </div>
      ) : (
        <p>글로벌 통계 없음</p>
      )}
    </div>
  );
}
