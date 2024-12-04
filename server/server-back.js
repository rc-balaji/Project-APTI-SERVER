const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");

var PORT = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
const usersFilePath = "./user.json";






///-------------------------------------------Topic




// Routes

// Endpoint to get all topics
app.get("/get-topics", (req, res) => {
  logRequest(req);
  try {
    const topics = readTopicsFile();
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get specific topics by IDs
app.get("/get-topic", (req, res) => {
  logRequest(req);
  try {
    const { ids } = req.query; // ids should be passed as a comma-separated list
    const topics = readTopicsFile();
    const selectedTopics = topics.filter((topic) =>
      ids.split(",").includes(topic.topic_id.toString())
    );
    res.json(selectedTopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  console.log("called");

  res.json({ Hello: "wewew" });
});















app.post("/validate", (req, res) => {
  logRequest(req);
  try {
    const { user_id, topic_id, subtopic_id, type, answers } = req.body;

    // Logging the request for debugging purposes
    logRequest(req);

    // Read topics file (assuming this function loads the topics data)
    const topics = readTopicsFile();

    // Find the topic based on topic_id
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // Find the subtopic based on subtopic_id
    const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    // Validate type (should be either "Practices" or "Test")
    if (!["Practices", "Test"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Get the relevant question section based on the type ("Practices" or "Test")
    const questionSection = subtopic.utils[type].find(
      (q) => q.question_id == question_id
    );
    if (!questionSection)
      return res.status(404).json({ error: "Question section not found" });

    // Initialize variables to store results
    let corrected_questions = [];
    let score = 0;

    // Iterate over each answer provided in the request body
    answers.forEach((answer) => {
      const correctQuestion = questionSection.questions.find(
        (q) => q.question_no == answer.question_no
      );
      if (!correctQuestion) return;

      const correctOption =
        correctQuestion.options[correctQuestion.correct_option];

      // Check if the selected option is correct
      const isCorrect = correctOption == answer.selected_option;

      // If correct, increment the score and add the question number to the corrected questions array
      if (isCorrect) {
        corrected_questions.push(answer.question_no);
        score += 1;
      }
    });

    // Send the response with corrected questions and total score
    res.json({ corrected_questions, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

