import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ExamScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  const { student_id, set_id } = useLocalSearchParams();

  // ✅ Format time helper
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // ✅ Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=get_questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: student_id,
            set_id: set_id,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setQuestions(data.data);
        setStartTime(Date.now()); // Start timer
      } else {
        Alert.alert("Error", "Failed to load questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ✅ Update timer every second
  useEffect(() => {
    if (startTime && !showResult) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, showResult]);

  // ✅ Decode base64 question text
  const decodeQuestion = (base64String) => {
    try {
      const decoded = atob(base64String);
      return decoded
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
    } catch (error) {
      return "Question could not be loaded";
    }
  };

  // ✅ Handle option select
  const handleOptionSelect = (option) => {
    if (answerSubmitted) return;

    setSelectedAnswer(option);
    setAnswerSubmitted(true);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const newUserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: option,
      correctAnswer: currentQuestion.answer,
      isCorrect,
      questionText: decodeQuestion(currentQuestion.question),
    };

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = newUserAnswer;
    setUserAnswers(updatedAnswers);
  };

  // ✅ Next Question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      loadPreviousAnswer(currentQuestionIndex + 1);
    } else {
      finishExam();
    }
  };

  // ✅ Previous Question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      loadPreviousAnswer(currentQuestionIndex - 1);
    }
  };

  // ✅ Load previous answer if available
  const loadPreviousAnswer = (index) => {
    const savedAnswer = userAnswers[index];
    if (savedAnswer) {
      setSelectedAnswer(savedAnswer.selectedAnswer);
      setAnswerSubmitted(true);
    } else {
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    }
  };

  // ✅ Finish exam
  const finishExam = () => {
    setEndTime(Date.now());
    setShowResult(true);
  };

  // ✅ Restart Exam
  const restartExam = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswerSubmitted(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setEndTime(null);
    setTimeSpent(0);
  };

  // ✅ Get correct answer text
  const getCorrectAnswerText = (question) => {
    const answerMap = {
      A: question.opt1,
      B: question.opt2,
      C: question.opt3,
      D: question.opt4,
    };
    return answerMap[question.answer] || "N/A";
  };

  // ✅ Get grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#4CAF50' };
    if (percentage >= 80) return { grade: 'A', color: '#8BC34A' };
    if (percentage >= 70) return { grade: 'B+', color: '#FFC107' };
    if (percentage >= 60) return { grade: 'B', color: '#FF9800' };
    if (percentage >= 50) return { grade: 'C', color: '#FF5722' };
    return { grade: 'F', color: '#F44336' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Questions...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ffeb44" />
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuestions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (showResult) {
    const percentage = ((score / questions.length) * 100);
    const { grade, color } = getGrade(percentage);
    const totalTimeSpent = endTime ? Math.floor((endTime - startTime) / 1000) : timeSpent;
    const correctAnswers = userAnswers.filter(answer => answer?.isCorrect).length;
    const incorrectAnswers = userAnswers.filter(answer => answer && !answer.isCorrect).length;
    const unanswered = questions.length - userAnswers.filter(answer => answer).length;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.resultMainContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScrollContent}>
            {/* Result Header */}
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={80} color="#ffeb44" />
              <Text style={styles.resultTitle}>Exam Completed!</Text>
            </View>

            {/* Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreMainSection}>
                <Text style={styles.scoreText}>{score}/{questions.length}</Text>
                <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
                <View style={[styles.gradeContainer, { backgroundColor: color }]}>
                  <Text style={styles.gradeText}>Grade: {grade}</Text>
                </View>
              </View>
              
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={24} color="#234785" />
                <Text style={styles.timeText}>Total Time: {formatTime(totalTimeSpent)}</Text>
              </View>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Performance Summary</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: '#E8F5E8' }]}>
                  <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                  <Text style={styles.statNumber}>{correctAnswers}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="close-circle" size={32} color="#F44336" />
                  <Text style={styles.statNumber}>{incorrectAnswers}</Text>
                  <Text style={styles.statLabel}>Incorrect</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="help-circle" size={32} color="#FF9800" />
                  <Text style={styles.statNumber}>{unanswered}</Text>
                  <Text style={styles.statLabel}>Unanswered</Text>
                </View>
              </View>
            </View>

            {/* Detailed Review */}
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewTitle}>Answer Review</Text>
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                return (
                  <View key={index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewQuestionNumber}>Q{index + 1}</Text>
                      {userAnswer ? (
                        <Ionicons 
                          name={userAnswer.isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={24} 
                          color={userAnswer.isCorrect ? "#4CAF50" : "#F44336"} 
                        />
                      ) : (
                        <Ionicons name="help-circle" size={24} color="#FF9800" />
                      )}
                    </View>
                    <Text style={styles.reviewQuestionText} numberOfLines={2}>
                      {decodeQuestion(question.question)}
                    </Text>
                    <View style={styles.reviewAnswers}>
                      <Text style={styles.reviewAnswer}>
                        Your Answer: <Text style={userAnswer?.isCorrect ? styles.correctText : styles.incorrectText}>
                          {userAnswer?.selectedAnswer || "Not Answered"}
                        </Text>
                      </Text>
                      <Text style={styles.reviewAnswer}>
                        Correct Answer: <Text style={styles.correctText}>{question.answer}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.resultButtonContainer}>
              <TouchableOpacity style={styles.restartButton} onPress={restartExam}>
                <Ionicons name="refresh" size={20} color="#234785" />
                <Text style={styles.restartButtonText}>Take Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeButton} onPress={() => {/* Navigate to home */}}>
                <Ionicons name="home" size={20} color="#234785" />
                <Text style={styles.homeButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: "A", text: currentQuestion.opt1 },
    { key: "B", text: currentQuestion.opt2 },
    { key: "C", text: currentQuestion.opt3 },
    { key: "D", text: currentQuestion.opt4 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Modern Header */}
      <LinearGradient colors={["#234785", "#1a3666"]} style={styles.modernHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.progressText}>Question {currentQuestionIndex + 1}</Text>
            <Text style={styles.totalText}>of {questions.length}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.scoreContainer}>
              <Ionicons name="trophy" size={16} color="#ffeb44" />
              <Text style={styles.scoreDisplay}>{score}</Text>
            </View>
            <View style={styles.timerContainer}>
              <Ionicons name="time" size={16} color="#ffeb44" />
              <Text style={styles.timerText}>{formatTime(timeSpent)}</Text>
            </View>
          </View>
        </View>
        
        {/* Enhanced Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Q{currentQuestionIndex + 1}.</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>Medium</Text>
            </View>
          </View>
          <Text style={styles.questionText}>
            {decodeQuestion(currentQuestion.question)}
          </Text>
        </View>

        {/* Enhanced Options */}
        <View style={styles.optionsContainer}>
          {options.map((option) => {
            let optionStyle = [styles.modernOptionButton];
            let textStyle = [styles.optionText];
            let iconName = "radio-button-off";
            let iconColor = "#cccccc";

            if (answerSubmitted) {
              if (option.key === currentQuestion.answer) {
                optionStyle.push(styles.correctOption);
                textStyle.push(styles.correctOptionText);
                iconName = "checkmark-circle";
                iconColor = "#4CAF50";
              } else if (option.key === selectedAnswer) {
                optionStyle.push(styles.wrongOption);
                textStyle.push(styles.wrongOptionText);
                iconName = "close-circle";
                iconColor = "#F44336";
              }
            } else if (selectedAnswer === option.key) {
              optionStyle.push(styles.selectedOption);
              textStyle.push(styles.selectedOptionText);
              iconName = "radio-button-on";
              iconColor = "#234785";
            }

            return (
              <TouchableOpacity
                key={option.key}
                style={optionStyle}
                onPress={() => handleOptionSelect(option.key)}
                disabled={answerSubmitted}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Ionicons name={iconName} size={24} color={iconColor} style={styles.optionIcon} />
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionLetter, textStyle]}>{option.key}.</Text>
                    <Text style={[textStyle, styles.optionTextMain]}>{option.text}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Enhanced Result Message */}
        {answerSubmitted && (
          <View style={styles.resultMessageCard}>
            {selectedAnswer === currentQuestion.answer ? (
              <View style={styles.correctMessageContainer}>
                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                <View style={styles.messageContent}>
                  <Text style={styles.correctMessage}>Excellent!</Text>
                  <Text style={styles.messageSubtext}>You got it right!</Text>
                </View>
              </View>
            ) : (
              <View style={styles.wrongMessageContainer}>
                <Ionicons name="close-circle" size={32} color="#F44336" />
                <View style={styles.messageContent}>
                  <Text style={styles.wrongMessage}>Incorrect</Text>
                  <Text style={styles.correctAnswerInfo}>
                    Correct answer: {currentQuestion.answer}. {getCorrectAnswerText(currentQuestion)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <View style={styles.navigationButtons}>
          {currentQuestionIndex > 0 ? (
            <TouchableOpacity style={styles.prevButton} onPress={prevQuestion}>
              <Ionicons name="chevron-back" size={20} color="#234785" />
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
          
          {currentQuestionIndex < questions.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.finishButton} onPress={finishExam}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  scrollView: { 
    flex: 1 
  },
  
  // Loading & Error States
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 18, 
    color: "#ffeb44",
    fontWeight: "600"
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 40
  },
  errorText: { 
    fontSize: 20, 
    color: "#ffeb44", 
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "600"
  },
  retryButton: {
    backgroundColor: "#ffeb44",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#234785",
  },
  retryButtonText: { 
    color: "#234785", 
    fontSize: 16, 
    fontWeight: "700" 
  },

  // Modern Header
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: "column",
  },
  progressText: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#ffeb44" 
  },
  totalText: {
    fontSize: 14,
    color: "rgba(255, 235, 68, 0.8)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  scoreDisplay: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#ffeb44" 
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffeb44",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(255, 235, 68, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#ffeb44",
    borderRadius: 3,
  },

  // Question Card
  questionCard: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginBottom: 15,
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumber: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#234785" 
  },
  difficultyBadge: {
    backgroundColor: "#E8F0F8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#234785",
  },
  questionText: { 
    fontSize: 17, 
    lineHeight: 26, 
    color: "#2c3e50",
    fontWeight: "400"
  },

  // Enhanced Options
  optionsContainer: { 
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modernOptionButton: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: { 
    borderColor: "#234785", 
    backgroundColor: "#f0f8ff",
    elevation: 3,
  },
  correctOption: { 
    borderColor: "#4CAF50", 
    backgroundColor: "#f1f8e9",
    elevation: 3,
  },
  wrongOption: { 
    borderColor: "#F44336", 
    backgroundColor: "#ffebee",
    elevation: 3,
  },
  optionContent: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 18
  },
  optionIcon: {
    marginRight: 16,
  },
  optionTextContainer: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  optionLetter: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginRight: 12,
    minWidth: 20,
  },
  optionText: { 
    fontSize: 15, 
    color: "#2c3e50",
    fontWeight: "400"
  },
  optionTextMain: {
    flex: 1,
  },
  selectedOptionText: { color: "#234785", fontWeight: "500" },
  correctOptionText: { color: "#4CAF50", fontWeight: "500" },
  wrongOptionText: { color: "#F44336", fontWeight: "500" },

  // Enhanced Result Message
  resultMessageCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  correctMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrongMessageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageContent: {
    marginLeft: 16,
    flex: 1,
  },
  correctMessage: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 4,
  },
  wrongMessage: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F44336",
    marginBottom: 8,
  },
  messageSubtext: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  correctAnswerInfo: { 
    fontSize: 15, 
    color: "#666", 
    lineHeight: 22,
    fontWeight: "400"
  },

  // Bottom Navigation
  bottomNavigation: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 2,
    borderTopColor: "#234785",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonPlaceholder: {
    width: 100,
  },
  prevButton: {
    backgroundColor: "#ffeb44",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    minWidth: 100,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#234785",
  },
  prevButtonText: { 
    color: "#234785", 
    fontSize: 16, 
    fontWeight: "700",
    marginLeft: 4,
  },
  nextButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    minWidth: 100,
    justifyContent: "center",
  },
  nextButtonText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "700",
    marginRight: 4,
  },
  finishButton: {
    backgroundColor: "#234785",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    minWidth: 100,
    justifyContent: "center",
  },
  finishButtonText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "700",
    marginLeft: 4,
  },

  // Result Screen
  resultMainContainer: { 
    flex: 1 
  },
  resultScrollContent: {
    paddingBottom: 30,
  },
  resultHeader: {
    alignItems: "center",
    paddingVertical: 40,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffeb44",
    marginTop: 16,
    textAlign: "center",
  },

  // Score Card
  scoreCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  scoreMainSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  scoreText: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#2c3e50",
    marginBottom: 8,
  },
  percentageText: { 
    fontSize: 52, 
    fontWeight: "bold", 
    color: "#234785",
    marginBottom: 16,
  },
  gradeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
  },

  // Statistics
  statsContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#234785",
    marginBottom: 20,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 4,
  },

  // Review Section
  reviewContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#234785",
    marginBottom: 20,
    textAlign: "center",
  },
  reviewItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#234785",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewQuestionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#234785",
  },
  reviewQuestionText: {
    fontSize: 14,
    color: "#2c3e50",
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewAnswers: {
    gap: 4,
  },
  reviewAnswer: {
    fontSize: 13,
    color: "#666",
  },
  correctText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  incorrectText: {
    color: "#F44336",
    fontWeight: "600",
  },

  // Result Buttons
  resultButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 16,
  },
  restartButton: {
    flex: 1,
    backgroundColor: "#ffeb44",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    gap: 8,
    borderWidth: 2,
    borderColor: "#234785",
  },
  restartButtonText: { 
    color: "#234785", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  homeButton: {
    flex: 1,
    backgroundColor: "#ffeb44",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    gap: 8,
    borderWidth: 2,
    borderColor: "#234785",
  },
  homeButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ExamScreen;