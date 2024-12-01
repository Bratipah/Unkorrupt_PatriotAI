import { Heading } from "@chakra-ui/react";
import React from "react";
import { Line } from "react-chartjs-2";
function LineChart({ chartData, title }) {
  return (
    <div className="chart-container">
      <Heading textAlign={'center'} size={'md'}>{title}</Heading>
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: title
            },
            legend: {
              display: false
            },
            colors: {
              enabled: true,
              forceOverride: true,
            },
          }
        }}
      />
    </div>
  );
}
export default LineChart;