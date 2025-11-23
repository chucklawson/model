import { memo } from 'react';
  import { BarChart,
      Bar,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      ReferenceLine}
      from 'recharts';
  import StatementAnalysisKeyMetricsData from "../Lib/ChartData/StatementAnalysisKeyMetricsData";

  {/*
  <PriceEarningsChart
                                        width={250}
                                        height={125}
                                        data={priceEarningsData}
                                        margin={{
                                            top: 5,
                                            right: 5,
                                            left: 5,
                                            bottom: 5
                                        }}
  */}

  interface margin{
    top: number;
    right: number;
    left: number;
    bottom: number;
  }
interface PriceEarningsChartProps {
  width: number;
  height: number;
  data:StatementAnalysisKeyMetricsData[];
  margin:margin;
  lineWidth: number;
}

  const PriceEarningsChart =(props:PriceEarningsChartProps)=>{

    //console.log("Trying to draw price to equity chart.")
    //console.log ("data: " + JSON.stringify(props.data))
    return (

      <div>
        <BarChart
            width={props.width}
            height={props.height}
            data={props.data}
            margin={props.margin}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="xAxisDataKey" />
            <YAxis />
            <Tooltip />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="priceToEarnings" fill="#82ca9d" />
        </BarChart>
      </div>
      
      
      
                
    );

  };

  export default memo(PriceEarningsChart); 