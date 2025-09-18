import React, { useState, useEffect } from 'react';
import { css } from '@emotion/react';
import {
  numberWithCommas,
  numberWithUnitFormatter,
} from '../../utils/formatter';
import { Echart } from '../echart';
import { colors } from '../../config';
import { Button, ButtonGroup, Card } from 'react-bootstrap';

function generateChartOption(data, dataType, isMobile) {
  const textByDataType = { confirmed: '확진자', death: '사망자' };

  const textByAge = {
    0: '0-9세',
    10: '10대',
    20: '20대',
    30: '30대',
    40: '40대',
    50: '50대',
    60: '60대',
    70: '70대',
    80: '80대 이상',
  };

  const ageKeys = Object.keys(data);
  const ageChartData = ageKeys.map((ageKey) => data[ageKey][dataType]);
  const total = ageChartData.reduce((acc, x) => acc + x, 0);

  const series = [
    {
      color: colors[dataType],
      type: 'bar',
      label: {
        show: true,
        position: 'top',
        rotate: isMobile ? 0 : 0, // 필요시 모바일에서만 회전
        formatter: (obj) => {
          const percent = ((obj.value / total) * 100).toFixed(1);
          return isMobile
            ? `${numberWithCommas(obj.value)}명`
            : `${numberWithCommas(obj.value)}명\n(${percent}%)`;
        },
      },
      data: ageChartData,
    },
  ];

  return {
    animation: true,
    title: {
      text: '대한민국 연령별 확진자 현황',
      subtext: `총 ${textByDataType[dataType]} 수 ${numberWithCommas(total)}명`,
      left: 'center',
    },
    grid: {
      left: 40,
      right: 20,
      bottom: isMobile ? 60 : 40, // 모바일이면 x축 레이블 공간 늘리기
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        rotate: 30,
        formatter: numberWithUnitFormatter,
      },
    },
    xAxis: {
      type: 'category',
      data: ageKeys.map((ageKey) => textByAge[ageKey]),
      axisLabel: {
        interval: 0,
        rotate: isMobile ? 30 : 0, // 모바일에서만 회전
        formatter: (value) =>
          isMobile && value.length > 4 ? value.slice(0, 3) + '…' : value, // 길면 줄임
      },
    },
    series,
  };
}

export function KoreaByAgeChart(props) {
  const { koreaByAgeChartData } = props;
  const [dataType, setDataType] = useState('confirmed');
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기에 따라 모바일 여부 체크
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartOption = generateChartOption(koreaByAgeChartData, dataType, isMobile);

  return (
    <Card>
      <Card.Body>
        <Echart
          wrapperCss={css`
            width: 100%;
            height: 400px;
          `}
          option={chartOption}
        />
        <ButtonGroup size="md">
          <Button
            variant="outline-primary"
            active={dataType === 'confirmed'}
            onClick={() => setDataType('confirmed')}
          >
            확진자
          </Button>
          <Button
            variant="outline-primary"
            active={dataType === 'death'}
            onClick={() => setDataType('death')}
          >
            사망자
          </Button>
        </ButtonGroup>
      </Card.Body>
    </Card>
  );
}
