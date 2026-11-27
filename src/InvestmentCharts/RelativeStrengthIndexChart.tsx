import React, { memo, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ReferenceDot
  } from "recharts";
import RSIChartData from "../Lib/ChartData/RSIChartData.ts";
import type { GroupedPurchase } from '../utils/purchaseIndicators';
import { matchPurchasesWithChartData } from '../utils/purchaseIndicators';
import type { AllTimeIndicator } from '../utils/allTimeHighLow';

{/*
 <RelativeStrengthIndexChart
                            width={graphWidth}
                            height={175}
                            data={rsiData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: 5,
                                bottom: 5
                            }}
                            lineWidth={widthOfStroke}
                            overBought={70}
                            overSold={30}>

                    </RelativeStrengthIndexChart>

*/}

interface Margin{
  top: number;
  right: number;
  left: number;
  bottom: number;
}

interface RelativeStrengthIndexChartProps{
  width: number;
  height: number;
  data: RSIChartData[];
  margin:Margin;
  lineWidth: number;
  overBought: number;
  overSold: number;
  purchaseData?: GroupedPurchase[];
  showPurchases?: boolean;
  athLoData?: AllTimeIndicator[];
  showAthLo?: boolean;
  last12MoData?: AllTimeIndicator[];
  showLast12Mo?: boolean;
}

  const RelativeStrengthIndexChart =(props:RelativeStrengthIndexChartProps)=>{
    // Match purchases with chart data
    const purchaseIndicators = useMemo(() => {
        if (!props.purchaseData || !props.showPurchases) return [];
        return matchPurchasesWithChartData(
            props.purchaseData,
            props.data,
            'rsiValue'
        );
    }, [props.purchaseData, props.data, props.showPurchases]);

    return (

      <div>
        <LineChart
          width={props.width}
          height={props.height}
          data={props.data}
          margin={props.margin}          
          >

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateOfClose" interval={4} angle={20} dx={0} scale="band"/>
          <YAxis type="number" domain={[0,100]} />
          <Tooltip />
          
          <Legend />
                <ReferenceLine y={props.overBought} label="Over Bought" stroke="red" />
                <Line type="monotone" dataKey="rsiValue" strokeWidth={props.lineWidth} stroke="#45848f" />
                <ReferenceLine y={props.overSold} label="Over Sold"  strokeWidth={props.lineWidth} stroke="red" />

                {/* All-time high/low indicators */}
                {props.showAthLo && props.athLoData?.map((indicator, index) => (
                    <ReferenceLine
                        key={`athl-rsi-${indicator.type}-${indicator.date}-${index}`}
                        x={indicator.date}
                        stroke={indicator.type === 'high' ? '#22c55e' : '#ef4444'}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                    />
                ))}

                {/* Last 12 months high/low indicators */}
                {props.showLast12Mo && props.last12MoData?.map((indicator, index) => (
                    <ReferenceLine
                        key={`l12-rsi-${indicator.type}-${indicator.date}-${index}`}
                        x={indicator.date}
                        stroke={indicator.type === 'high' ? '#a855f7' : '#f97316'}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                    />
                ))}

                {/* Purchase indicators */}
                {props.showPurchases && purchaseIndicators.map((indicator, index) => (
                    <React.Fragment key={`purchase-rsi-${indicator.date}-${index}`}>
                        {/* Vertical line to highlight purchase date */}
                        <ReferenceLine
                            x={indicator.date}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            label={{
                                value: '↓',
                                position: 'top',
                                fill: '#3b82f6',
                                fontSize: 16,
                            }}
                        />

                        {/* Dot at RSI value */}
                        <ReferenceDot
                            x={indicator.date}
                            y={indicator.yValue}
                            r={6}
                            fill="#3b82f6"
                            stroke="#fff"
                            strokeWidth={2}
                            label={{
                                value: '$',
                                position: 'center',
                                fill: '#fff',
                                fontSize: 10,
                                fontWeight: 'bold',
                            }}
                        />
                    </React.Fragment>
                ))}
        </LineChart>
      </div>
      
      
      
                
    );

  };

  export default memo(RelativeStrengthIndexChart); 