import { Heading } from "@chakra-ui/react";
import { Bar } from "react-chartjs-2";
const BarChart = ({ chartData, title }) => {
  return (
    <div className="chart-container">
      <Heading textAlign={'center'} size={'md'}>{title}</Heading>
      <Bar
        style={{
          width: "400px",
        }}
        data={chartData}
        options={{
          plugins: {
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
};

export default BarChart;