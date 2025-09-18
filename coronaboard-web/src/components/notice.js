import React from 'react';
import { css } from '@emotion/react';

export function Notice(props) {
  const { notice } = props;

  return (
    <div
      css={css`
        padding-top: 20px;
        text-align: center;
      `}
    >
      <h2
        css={css`
          font-size: 20px;
          font-weight: bold;      /* 글자 굵게 */
          color: red;             /* 빨간색 */
          margin-bottom: 16px;    /* 아래 여백 한 줄 정도 */
        `}
      >
        [안내 사항]
      </h2>
      {notice.map((x, idx) => (
        <p key={idx}>{x.message}</p>
      ))}
    </div>
  );
}
