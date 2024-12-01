import React, { useEffect, useState, lazy, Suspense } from "react";
import "./reportspage.css";
import Layout from "../components/Layout";
import { UN_backend } from "../../../declarations/UN_backend";
import { parseValues } from "../helper/parser";
import { createBackendActor, createClient } from "../helper/auth";
import withAuth from "../lib/withAuth";
import {
  Box,
  Button,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Chart from "chart.js/auto";
import { CategoryScale, Colors } from "chart.js";
import { Categories } from "../helper/enum";
import {
  allCountries,
  getCountryName,
  getStateName,
} from "../helper/countries";

const PieChart = lazy(() => import("../components/PieChart"));
const BarChart = lazy(() => import("../components/BarChart"));
const LineChart = lazy(() => import("../components/LineChart"));

Chart.register(CategoryScale);
Chart.register(Colors);
Chart.defaults.color = "#fff";

const ReportsPage = () => {
  // Hardcoded data with the same image for all reports
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [upvotes, setUpvotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState("All");

  const [activeTab, setActiveTab] = useState("New Reports"); // State to manage the active tab

  const toast = useToast();

  const Data = [
    {
      id: 1,
      year: 2016,
      userGain: 80000,
      userLost: 823,
    },
    {
      id: 2,
      year: 2017,
      userGain: 45677,
      userLost: 345,
    },
    {
      id: 3,
      year: 2018,
      userGain: 78888,
      userLost: 555,
    },
    {
      id: 4,
      year: 2019,
      userGain: 90000,
      userLost: 4555,
    },
    {
      id: 5,
      year: 2020,
      userGain: 4300,
      userLost: 234,
    },
  ];

  function categorizeReports() {
    const data = new Array(Categories.length).fill(0);
    reports
      .filter((item) => {
        if (country == "All") return true;
        return item.country == country;
      })
      .forEach((item) => {
        data[Categories.indexOf(item.category)] += 1;
      });
    return data;
  }

  function categorizeByCountry() {
    const data = {};
    reports.forEach((item) => {
      data[item.country] = (data[item.country] || 0) + 1;
    });
    return data;
  }

  const [dataByCategory, setDataByCategory] = useState({
    labels: Categories,
    datasets: [
      {
        label: "Amount",
        data: [],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });

  const [dataByCountry, setDataByCountry] = useState({
    labels: [],
    datasets: [
      {
        label: "Amount",
        data: [],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });

  useEffect(() => {
    setDataByCategory({
      labels: Categories,
      datasets: [
        {
          label: "Amount",
          data: categorizeReports(),
          borderColor: "black",
          borderWidth: 2,
        },
      ],
    });
  }, [reports, country]);

  useEffect(() => {
    const byCountry = categorizeByCountry();
    setDataByCountry({
      labels: Object.keys(byCountry).map(getCountryName),
      datasets: [
        {
          label: "Amount",
          data: Object.values(byCountry),
          borderColor: "black",
          borderWidth: 2,
        },
      ],
    });
  }, [reports]);

  const upvoteReport = async (id) => {
    const authClient = await createClient();
    const actor = await createBackendActor(authClient.getIdentity());
    setIsLoading(true);
    try {
      const response = await actor.upvoteReport(id);
      if (response.ok !== undefined) {
        setUpvotes({
          ...upvotes,
          [id]: Number(response.ok),
        });
      } else {
        toast({
          title: "Error upvoting report",
          description: response.err,
          status: "error",
          position: "top",
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderReports = () => {
    switch (activeTab) {
      case "New Reports":
        return reports.slice(reports.length - 2).reverse(); // Show only the first two reports
      case "All Reports":
        return reports; // Show all reports
      case "Analytics":
        return []; // No reports to show for analytics (can be updated based on actual requirement)
      default:
        return reports;
    }
  };

  useEffect(() => {
    // Load reports
    async function load() {
      const response = await UN_backend.listReports("");
      setReports(await parseValues(response));
    }
    load();
  }, []);

  useEffect(() => {
    setUpvotes(
      reports.reduce((acc, report) => {
        acc[report.id] = report.upvotes || 0;
        return acc;
      }, {})
    );
  }, [reports]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="all-reports">
      <Layout />
      <div className="reports-cont">
        <h2>Reports!</h2>
        <div className="report-tabs">
          <span
            className={activeTab === "New Reports" ? "active-tab" : ""}
            onClick={() => setActiveTab("New Reports")}
          >
            New Reports
          </span>
          <span
            className={activeTab === "All Reports" ? "active-tab" : ""}
            onClick={() => setActiveTab("All Reports")}
          >
            All Reports
          </span>
          <span
            className={activeTab === "Analytics" ? "active-tab" : ""}
            onClick={() => setActiveTab("Analytics")}
          >
            Analytics
          </span>
        </div>
        <div className="new-reports-section">
          <div className="reports-grid">
            {renderReports().map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-image">
                  <img src={report.image} alt={report.name} />
                </div>
                <div className="report-details">
                  <h3
                    style={{
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedReport(report);
                      onOpen();
                    }}
                  >
                    {`Report #${report.id + 1}`}
                  </h3>
                  <p>{report.category}</p>
                  <button
                    className="like-button"
                    onClick={() => upvoteReport(report.id)}
                  >
                    👍 {upvotes[report.id]}
                  </button>
                </div>
              </div>
            ))}
            {isLoading && (
              <Spinner pos={"fixed"} top={2} right={2} size={"xs"} />
            )}
            {activeTab === "Analytics" && (
              <Suspense fallback={<div>Loading...</div>}>
                <Stack spacing={5}>
                  <Box>
                    <Box mb={4}>
                      <Text fontWeight={500} mb={2}>
                        Filter by country
                      </Text>
                      <Select
                        id="country"
                        name="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        _selected={{
                          bg: "white !important",
                        }}
                      >
                        <option value={"All"}>All</option>
                        {allCountries
                          .filter((country) => {
                            return country.region === "Africa";
                          })
                          .map((country, index) => (
                            <option key={index} value={country.code2}>
                              {country.name}
                            </option>
                          ))}
                      </Select>
                    </Box>
                    <PieChart
                      chartData={dataByCategory}
                      title={"Total reports by category"}
                    />
                  </Box>
                  <BarChart
                    chartData={dataByCountry}
                    title={"Total reports by country"}
                  />
                </Stack>
                {/* <LineChart chartData={chartData} /> */}
              </Suspense>
            )}
          </div>
          {selectedReport && (
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Report #{selectedReport.id + 1}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Box
                    mb={4}
                    height={"200px"}
                    rounded={"lg"}
                    overflow={"hidden"}
                  >
                    <Image
                      width={"100%"}
                      height={"100%"}
                      objectFit={"cover"}
                      src={selectedReport.image}
                      alt={selectedReport.name}
                    />
                  </Box>

                  <Stack spacing={5}>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        Country
                      </Heading>
                      <Text>{getCountryName(selectedReport.country)}</Text>
                    </Box>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        State
                      </Heading>
                      <Text>
                        {getStateName(
                          selectedReport.country,
                          selectedReport.state
                        )}
                      </Text>
                    </Box>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        Upvotes
                      </Heading>
                      <Text>{selectedReport.upvotes}</Text>
                    </Box>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        Category
                      </Heading>
                      <Text>{selectedReport.category}</Text>
                    </Box>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        Details
                      </Heading>
                      <Text>{selectedReport.details}</Text>
                    </Box>
                    <Box>
                      <Heading size={"xs"} mb={1}>
                        Reporter
                      </Heading>
                      <Text>{selectedReport.owner.toText()}</Text>
                    </Box>
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

const Page = withAuth(ReportsPage);

export default Page;
