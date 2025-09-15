import React from 'react';
import { css } from '@emotion/react';
import { Container } from 'react-bootstrap';

export function Footer() {
  return (
    <div
      css={css`
        color: white;
        background-color: black;
        text-align: center;
      `}
    >
      <Container
        css={css`
          padding: 36px 0;
        `}
      >
        © 2026년 행복한 일들만 가득하시길 기원합니다.
          연락처 (4fvsx3@gmail.com)
      </Container>
    </div>
  );
}
