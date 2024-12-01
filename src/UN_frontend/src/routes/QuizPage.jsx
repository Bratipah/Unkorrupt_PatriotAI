import { useEffect, useState } from "react";
import { quiz } from "../components/quiz/questions";
import "./quiz.css";
import Layout from "../components/Layout";
import withAuth from "../lib/withAuth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UN_backend } from "../../../declarations/UN_backend";
import { Box, Center, Spinner, Text, useToast } from "@chakra-ui/react";
import { parseValues } from "../helper/parser";
import { createBackendActor, createClient } from "../helper/auth";

const Quiz = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();
  const courseTitle = location.state?.title || `Course ${courseId}`;
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [result, setResult] = useState({
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questions, setQuestions] = useState([]);

  const currentQuestion = questions[activeQuestion];
  const { question, choices, correctAnswer } = questions.length
    ? currentQuestion
    : {
        question: null,
        choices: null,
        correctAnswer: null,
      };

  const onClickNext = async () => {
    setSelectedAnswerIndex(null);
    setResult((prev) =>
      selectedAnswer
        ? {
            ...prev,
            score: prev.score + 5,
            correctAnswers: prev.correctAnswers + 1,
          }
        : { ...prev, wrongAnswers: prev.wrongAnswers + 1 }
    );
    if (activeQuestion !== questions.length - 1) {
      setActiveQuestion((prev) => prev + 1);
    } else {
      setActiveQuestion(0);

      // Handle submission
      console.log(selectedAnswers);

      try {
        setIsSubmitting(true);
        const authClient = await createClient();
        const actor = await createBackendActor(authClient.getIdentity());
        const response = await actor.submitQuestionsAttempt(
          parseInt(courseId),
          selectedAnswers
        );
        if (response.ok) {
          toast({
            title: "You passed, well done",
            description: "10 UNK tokens has been minted to your account",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        } else {
          toast({
            title: "Failed",
            description: response.err,
            duration: 5000,
            isClosable: true,
            position: "top",
            status: 'error'
          });
        }
      } catch (error) {
        console.log(error);
        toast({
          title: "Error submitting answers",
          duration: 5000,
          isClosable: true,
          position: "top",
            status: 'error'
        });
      } finally {
        setIsSubmitting(false);
        setShowResult(true);
      }
    }
  };

  
  // Load course questions
  async function loadQuestions() {
    setIsLoadingQuestions(true);
    const response = await UN_backend.getRandomCourseQuestions(
      parseInt(courseId),
      5
    );
    console.log("Course questions", response);
    if (response.ok) {
      const loadedQuestions = await parseValues(response.ok);
      const formattedQs = loadedQuestions.map((item) => {
        const options = item.options.map((opt) => opt.description);
        return {
          id: item.id,
          question: item.description,
          choices: options,
          correctAnswer: options[item.correctOption],
          correctOption: item.correctOption,
        };
      });
      setQuestions(formattedQs);
    } else {
      toast({
        title: "Failed to get questions",
        description: response.err,
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
    setIsLoadingQuestions(false);
  }

  const reloadQuiz = async () => {
    setResult({
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    })
    setShowResult(false);
    await loadQuestions();
  };

  const onAnswerSelected = (answer, index) => {
    setSelectedAnswers((prev) => {
      return [
        ...prev,
        {
          questionId: currentQuestion.id,
          option: index,
        },
      ];
    });
    setSelectedAnswerIndex(index);
    if (index === currentQuestion.correctOption) {
      setSelectedAnswer(true);
    } else {
      setSelectedAnswer(false);
    }
  };

  const addLeadingZero = (number) => (number > 9 ? number : `0${number}`);

  useEffect(() => {
    if (courseId) loadQuestions();
  }, [courseId]);

  return (
    <div className="quizbody">
      <Layout />
      <div className="quiz-container">
        {isSubmitting && (
          <Box
            display={"flex"}
            flexDirection={"column"}
            alignContent={"center"}
            gap={4}
          >
            <Text>Submitting</Text>
            <Spinner size={"lg"} />
          </Box>
        )}
        {isLoadingQuestions ? (
          <Box>
            <Center>
              <Spinner size={"lg"} />
            </Center>
          </Box>
        ) : questions.length ? (
          !showResult ? (
            !isSubmitting && (
              <div>
                <div>
                  <span className="active-question-no">
                    {addLeadingZero(activeQuestion + 1)}
                  </span>
                  <span className="total-question">
                    /{addLeadingZero(questions.length)}
                  </span>
                </div>
                <h2>{question}</h2>
                <ul>
                  {choices.map((answer, index) => (
                    <li
                      onClick={() => onAnswerSelected(answer, index)}
                      key={answer}
                      className={
                        selectedAnswerIndex === index ? "selected-answer" : null
                      }
                    >
                      {answer}
                    </li>
                  ))}
                </ul>
                <div className="flex-right">
                  <button
                    onClick={onClickNext}
                    disabled={selectedAnswerIndex === null}
                  >
                    {activeQuestion === questions.length - 1
                      ? "Finish"
                      : "Next"}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="result">
              <h3>Result</h3>
              <p>
                Total Question: <span>{questions.length}</span>
              </p>
              <p>
                Tokens Earned:<span> {result.wrongAnswers ? 0 : 10}</span>
              </p>
              <p>
                Correct Answers:<span> {result.correctAnswers}</span>
              </p>
              <p>
                Wrong Answers:<span> {result.wrongAnswers}</span>
              </p>

              {result.wrongAnswers === 0 ? (
                <button
                  className="reload-quiz-button"
                  onClick={() => navigate("/coursePage")}
                >
                  <span>Take a new course</span>
                </button>
              ) : (
                <button
                  className="reload-quiz-button"
                  onClick={reloadQuiz}
                >
                  <span>Take the quiz again?</span>
                </button>
              )}
            </div>
          )
        ) : (
          <Box>
            <Center>
              <Text>No questions</Text>
            </Center>
          </Box>
        )}
      </div>
    </div>
  );
};

const Page = withAuth(Quiz);
export default Page;
