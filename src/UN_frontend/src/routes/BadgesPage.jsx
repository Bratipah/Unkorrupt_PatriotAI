import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./badges.css";
import Layout from "../components/Layout";
import withAuth from "../lib/withAuth";
import { useAuthClient } from "../use-auth-client";
import { Center, Spinner, Text, Box } from "@chakra-ui/react";
import { createBackendActor, createClient } from "../helper/auth";

const BadgesPage = () => {
  const { identity } = useAuthClient();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBadges = useCallback(async () => {
    setIsLoading(true);
    try {
      const authClient = await createClient();
      const actor = await createBackendActor(authClient.getIdentity());
      const response = await actor.getUserBadges(); // Assume getUserBadges fetches badges
      setIsLoading(false);
      if (response.err) {
        setBadges([]); // No badges
      } else {
        setBadges(response.ok);
      }
    } catch (error) {
      console.error("Failed to fetch badges:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return (
    <div className="badge-page">
      {/* <Layout /> */}
      <div className="badge-container">
        <button className="back-button" onClick={() => navigate("/progressPage")}>
          Back to Progress
        </button>
        {isLoading ? (
          <Center>
            <Spinner size="lg" />
          </Center>
        ) : badges.length === 0 ? (
          <Center>
            <Text>No badges yet</Text>
          </Center>
        ) : (
          <div className="badge-list">
            {badges.map((badge, index) => (
              <Box key={index} className="badge-item">
                <Text fontWeight="bold">{badge.title}</Text>
                <Text>{badge.description}</Text>
              </Box>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Page = withAuth(BadgesPage);
export default Page;
