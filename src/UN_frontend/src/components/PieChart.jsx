import { Heading } from "@chakra-ui/react";
import React from "react";
import { Pie } from "react-chartjs-2";

function PieChart({ chartData, title }) {
  return (
    <div className="chart-container">
      <Heading textAlign={'center'} size={'md'}>{title}</Heading>
      <Pie
        style={{
          width: "500px",
        }}
        data={chartData}
        options={{
          plugins: {
            colors: {
              enabled: true,
              forceOverride: true,
            },
          },
        }}
      />
    </div>
  );
}
export default PieChart;
