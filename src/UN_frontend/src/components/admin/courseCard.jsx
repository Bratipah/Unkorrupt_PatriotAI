import {
  Heading,
  Avatar,
  Box,
  Center,
  Image,
  Flex,
  Text,
  Stack,
  Button,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import { CourseStatus, getEnum } from "../../helper/enum";

export default function CourseCard({ course, onSelect }) {
  const status = getEnum(course.status, CourseStatus);
  let statusColor = "";
  switch (status) {
    case "InFix":
      statusColor = "yellow";
      break;
    case "InReview":
      statusColor = "blue";
      break;
    case "Rejected":
      statusColor = "red";
      break;
    case "Approved":
      statusColor = "green";
      break;
    default:
      statusColor = "gray";
  }
  return (
    <Center>
      <Box
        maxW={"320px"}
        minW={"320px"}
        bg={useColorModeValue("white", "#1a202c8f")}
        boxShadow={"2xl"}
        rounded={"md"}
        overflow={"hidden"}
      >
        <Box py={6} px={4}>
          <Stack spacing={0} align={"center"} mb={5}>
            <Heading
              textAlign={"center"}
              fontSize={"2xl"}
              fontWeight={500}
              fontFamily={"body"}
            >
              {course.title}
            </Heading>
            <Badge colorScheme={statusColor}>{status}</Badge>
          </Stack>

          <Stack direction={"row"} justify={"center"} spacing={6}>
            <Stack spacing={0} align={"center"}>
              <Text fontWeight={600}>{course.enrolledCount}</Text>
              <Text fontSize={"sm"} color={"gray.500"}>
                Enrolled
              </Text>
            </Stack>
            <Stack spacing={0} align={"center"}>
              <Text fontWeight={600}>{course.reportCount}</Text>
              <Text fontSize={"sm"} color={"gray.500"}>
                Reports
              </Text>
            </Stack>
          </Stack>

          <Button
            w={"full"}
            mt={4}
            bg={useColorModeValue("#151f21", "gray.900")}
            color={"white"}
            rounded={"md"}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            onClick={onSelect}
          >
            View
          </Button>
        </Box>
      </Box>
    </Center>
  );
}
