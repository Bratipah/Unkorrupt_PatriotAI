import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./chatpage.css";
import { FaArrowLeft } from "react-icons/fa";
import { backend } from "../../../declarations/backend";
import Layout from "../components/Layout";
import withAuth from "../lib/withAuth";
import { getEnum, MessgeType, RunStatus } from "../helper/enum";
import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { parseValue } from "../helper/parser";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IoHelp } from "react-icons/io5";
import { FiHelpCircle } from "react-icons/fi";
import { useActor } from "../hooks/useActor";

const ChatPage = () => {
  const { actor } = useActor();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const courseTitle = location.state?.title || `Course ${courseId}`;
  const [courseDetails, setCourse] = useState(null);
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [runId, setRunId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const myScrollableElementRef = useRef(null);

  const toast = useToast();
  const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

  async function pollRunStatus(runId) {
    while (true) {
      const response = await actor.getRunStatus(runId);
      console.log("PollRunStatus", response);
      if (response.ok) {
        const enumStatus = getEnum(response.ok, RunStatus);
        switch (enumStatus) {
          case "InProgress":
            await sleep(1000);
            break;
          default:
            return enumStatus;
        }
      } else {
        console.log("Run ID error", response.err);
        return;
      }
    }
  }

  async function getRunMessage(runId) {
    const response = await actor.getRunMessage(runId);
    if (response.ok) {
      return response.ok.content;
    } else {
      console.log(response.err);
      toast({
        title: "Could not get response",
        description: response.err,
        duration: 5000,
        isClosable: true,
        position: "top",
        status: "error",
      });
    }
  }

  async function sendThreadMessage(threadId, message) {
    try {
      console.log("got here", threadId);
      setIsSending(true);
      const response = await actor.sendThreadMessage(threadId, message);
      console.log("sendThreadMessage", response);
      if (response.ok.Completed) {
        const runId = response.ok.Completed.runId;
        const status = await pollRunStatus(runId);
        console.log("Got success status", status);
        if (!status) {
          toast({
            title: "Message error",
            description: "Not found",
            duration: 5000,
            isClosable: true,
            position: "top",
            status: "error",
          });
          setIsSending(false);
          return;
        }
        switch (status) {
          case "Completed":
            const content = await getRunMessage(runId);
            if (content) {
              setMessages((prevMessages) => [
                ...prevMessages,
                {
                  sender: "system",
                  text: content,
                },
              ]);
            }
            break;
          default:
            break;
        }
      } else {
        if (response.err.ThreadLock) {
          const pendingRunId = response.err.ThreadLock.runId;
          console.log("Pending run id", pendingRunId);
          setRunId(pendingRunId);
          return;
        }
        if (response.err.Failed) {
          toast({
            title: "Failed to send message",
            description: response.err.Failed,
            duration: 5000,
            isClosable: true,
            position: "top",
            status: "error",
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  }

  const [messages, setMessages] = useState([
    { sender: "system", text: "Welcome! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");

  const predefinedQuestions = [
    "What is this course about?",
    "Can you provide resources?",
    "How can I contact support?",
  ];

  const scrollToBottom = (element) => {
    element.scrollTop = element.scrollHeight - element.offsetHeight;
  };

  useEffect(() => {
    // Load course details
    async function load() {
      setIsLoading(true);
      const response = await backend.getCourseDetails(parseInt(courseId));
      console.log("Course details", response);
      if (response.ok) {
        setCourse(await parseValue(response.ok));
        const enrolledData = await actor.getUserEnrolledCourse(
          parseInt(courseId)
        );
        console.log(enrolledData);
        if (enrolledData.ok) {
          const enrolled = await parseValue(enrolledData.ok);
          if (enrolled.messages.length) {
            setMessages(
              enrolled.messages.map((item) => {
                return {
                  sender: getEnum(item.role, MessgeType).toLowerCase(),
                  text: item.content,
                };
              })
            );
            await sleep(1000);
            scrollToBottom(myScrollableElementRef.current);
          }
          setEnrolledCourse(enrolled);
        } else {
          toast({
            title: "Failed to get enrolled course",
            description: enrolledData.err,
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }
      } else {
        toast({
          title: "Failed to get course details",
          description: response.err,
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
      setIsLoading(false);
    }
    if (courseId) load();
  }, [courseId]);

  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (userInput.trim()) {
      sendMessage(userInput);
      setUserInput("");
    }
  };

  const handlePredefinedQuestionClick = (question) => {
    sendMessage(question);
  };

  const sendMessage = async (messageText) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: messageText },
    ]);

    // Handle system responses
    if (messageText.toLowerCase() === predefinedQuestions[0].toLowerCase()) {
      console.log("courseDetails", courseDetails);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "system",
          text: courseDetails
            ? courseDetails.summary
            : "Sorry, course details are not available.",
        },
      ]);
    } else if (
      messageText.toLowerCase() === predefinedQuestions[1].toLowerCase()
    ) {
      if (courseDetails && courseDetails?.resources?.length > 0) {
        const resourceMessages = courseDetails.resources.map((resource) => ({
          sender: "system",
          text: `${resource.title}: ${resource.description}`,
          link: resource.url,
        }));
        setMessages((prevMessages) => [...prevMessages, ...resourceMessages]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "system",
            text: "No resources available for this course.",
          },
        ]);
      }
    } else if (
      messageText.toLowerCase() === predefinedQuestions[2].toLowerCase()
    ) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "system",
          text: "You can contact support at support@example.com or call 1-800-123-4567.",
        },
      ]);
    } else {
      console.log(messageText, enrolledCourse);
      await sendThreadMessage(enrolledCourse.threadId, messageText);
    }
  };

  return (
    <div className="chat-body">
      <Layout />
      <div className="chat-container">
        <div className="chat-header">
          <Flex align={"center"}>
            <FaArrowLeft className="back-icon" onClick={() => navigate(-1)} />
            <h1>{courseTitle}</h1>
          </Flex>
          <Box>
            {isLoading && (
              <Spinner
                marginRight={"auto"}
                size={"lg"}
                borderBottomColor={"#a020f0 !important"}
              />
            )}
          </Box>
        </div>

        <div className="chat-content">
          <div className="chat-messages" ref={myScrollableElementRef}>
            {!isLoading &&
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${
                    message.sender === "user"
                      ? "user-message"
                      : "system-message"
                  }`}
                >
                  {message.link ? (
                    <a href={message.link} target="_blank">
                      {message.text}
                    </a>
                  ) : (
                    <Markdown
                      className={"markdown"}
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.text}
                    </Markdown>
                  )}
                </div>
              ))}
          </div>

          {messages.length === 1 && !isLoading && (
            <div className="predefined-questions-container">
              <img src="/patriot.png" alt="" />
              <div className="predefined-questions-grid">
                {predefinedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="question-card"
                    onClick={() => handlePredefinedQuestionClick(question)}
                  >
                    {question}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isLoading && (
          <div className="chat-input">
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type your message..."
              />
              {isSending ? (
                <Spinner borderBottomColor={"#a020f0 !important"} />
              ) : (
                <button type="submit">Send</button>
              )}
              <Button
                className="quiz-button"
                _hover={{
                  bg: "#8b00e0",
                }}
                bg={"#a020f0"}
                rounded={"2rem"}
                leftIcon={<FiHelpCircle />}
                onClick={() => {
                  navigate(`/quizPage/${courseId}`, {
                    state: { title: courseTitle },
                  });
                }}
              >
                Quiz
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const Page = withAuth(ChatPage);
export default Page;
