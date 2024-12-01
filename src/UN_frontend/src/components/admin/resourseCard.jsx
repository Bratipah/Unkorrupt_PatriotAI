"use client";

import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Button,
  Link,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { getEnum, ResourceType } from "../../helper/enum";

export default function ResourceCard({ resource }) {
  return (
    <Center py={6}>
      <Box
        h={'100%'}
        maxW={"320px"}
        minW={"320px"}
        w={"full"}
        bg={"#171923f0"}
        boxShadow={"2xl"}
        rounded={"lg"}
        p={6}
        textAlign={"center"}
      >
        <Heading fontSize={"2xl"} fontFamily={"body"}>
          {resource.title}
        </Heading>
        <Text
          textAlign={"center"}
          color={useColorModeValue("gray.700", "gray.400")}
          px={3}
        >
          {resource.description}
        </Text>

        <Stack align={"center"} justify={"center"} direction={"row"} mt={6}>
          <Badge
            px={2}
            py={1}
            bg={useColorModeValue("gray.50", "gray.800")}
            fontWeight={"400"}
          >
            {getEnum(resource.rType, ResourceType)}
          </Badge>
        </Stack>

        <Stack mt={8} direction={"row"} spacing={4} justify={"center"}>
          <Link isExternal href={resource.url}>
            <Button
              flex={1}
              fontSize={"sm"}
              rounded={"full"}
              bg={"blue.400"}
              color={"white"}
              boxShadow={
                "0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)"
              }
              _hover={{
                bg: "blue.500",
              }}
              _focus={{
                bg: "blue.500",
              }}
            >
              View
            </Button>
          </Link>
        </Stack>
      </Box>
    </Center>
  );
}
