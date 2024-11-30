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

const readUsersData = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
  } catch (error) {
    throw new Error("Failed to read users data: " + error.message);
  }
};

const saveUsersData = (data) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error("Failed to save users data: " + error.message);
  }
};

app.post("/register", (req, res) => {
  try {
    console.log("Register");
    const { name, email, password, dob, city, state, country } = req.body;

    if (!name || !email || !password || !dob || !city || !state || !country) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const users = readUsersData();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const user = {
      user_id: users.length + 1,
      name,
      role: "user",
      email,
      password,
      dob,
      city,
      state,
      country,
      topics: [],
      test_history: [],
    };

    users.push(user);
    saveUsersData(users);
    res.status(201).json({
      message: "Registration successful, redirecting to user page.",
      role: "user",
    });
  } catch (error) {
    console.error("Error in /register:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});




///-------------------------------------------Topic

// File path to store topics
const filePath = path.join(__dirname, "./topics.json");

// Read topics data from the file
const readTopicsFile = () => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading topics file:", err);
    throw new Error("Unable to read topics file");
  }
};

// Write topics data to the file
const writeTopicsFile = (data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to topics file:", err);
    throw new Error("Unable to write to topics file");
  }
};

// Log request and data
const logRequest = (req) => {
  console.log(`Request Method: ${req.method}`);
  console.log(`Request URL: ${req.originalUrl}`);
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  console.log(`Request Query: ${JSON.stringify(req.query)}`);
};

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










app.get("/contents", (req, res) => {
  logRequest(req);
  try {
    const { topic_id, subtopic_id, utils } = req.query;
    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    if (utils === "content") {
      return res.json({ content: subtopic.utils.Learning_Materials.contents });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all questions or contents
app.get("/questions", (req, res) => {
  logRequest(req);
  try {
    const { topic_id, subtopic_id, utils } = req.query;
    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    if (utils === "content") {
      return res.json({ content: subtopic.utils.Learning_Materials.contents });
    } else if (utils === "Practices" || utils === "Test") {
      return res.json(subtopic.utils[utils]);
    } else {
      return res.status(400).json({ error: "Invalid utility type" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ dest: "uploads/" });

const xlsx = require("xlsx");


app.post("/download-sample", (req, res) => {
  const { topic_id, subtopic_id, title_id, type, no_of_questions } = req.body;

  if (!topic_id || !subtopic_id || !title_id || !type || !no_of_questions) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Sample data
    const sampleData = {
      topic_id: topic_id,
      subtopic_id: subtopic_id,
      title_id: title_id,
      type: type,
      question: "What is LED?",
      options: [
        "Light Emitting Diode",
        "Low Energy Device",
        "Light Energy Device",
        "Linear Energy Diode",
      ],
      correct_option: 1,
      explanation:
        "An LED is a semiconductor device that emits light when an electric current passes through it. It is widely used in electronic displays, lighting, and indicators.",
    };

    // Prepare rows for the spreadsheet
    const rows = [];
    for (let i = 1; i <= no_of_questions; i++) {

      if(i===1){
      rows.push({
        S_No: i,
        topic_id: sampleData.topic_id,
        subtopic_id: sampleData.subtopic_id,
        title_id: sampleData.title_id,
        type: sampleData.type,
        question: sampleData.question,
        option_1: sampleData.options[0],
        option_2: sampleData.options[1],
        option_3: sampleData.options[2],
        option_4: sampleData.options[3],
        correct_option: sampleData.correct_option,
        explanation: sampleData.explanation,
      });
    }else{
      rows.push({
        S_No: i,
        topic_id: sampleData.topic_id,
        subtopic_id: sampleData.subtopic_id,
        title_id: sampleData.title_id,
        type: sampleData.type,
        question: "",
        option_1: "",
        option_2: "",
        option_3: "",
        option_4: "",
        correct_option: "",
        explanation:"",
      });
    }
  }

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sample Data");

    // Generate a file
    const filePath = path.join(__dirname, "Sample_Format.xlsx");
    xlsx.writeFile(workbook, filePath);

    // Send the file to the client
    res.download(filePath, "Sample_Format.xlsx", (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "File download failed" });
      }

      // Delete the file after sending
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/add/questions/import", upload.single("file"), (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const questionsData = XLSX.utils.sheet_to_json(sheet);

    const topics = readTopicsFile(); // Load existing topics
    console.log(topics);
    
    questionsData.forEach((row) => {
      const {
        topic_id,
        subtopic_id,
        title_id,
        type,
        question,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_option,
        explanation
      } = row;

      console.log(topic_id,
        subtopic_id,
        title_id,
        type,
        question,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_option,
        explanation);
      

      // Find the topic
      const topic = topics.find((t) => t.topic_id == topic_id);

      console.log(topic);
      
      if (!topic) {
        console.log(`Topic not found for topic_id: ${topic_id}`);
        return; // Skip this row if topic is not found
      }

      // Find the subtopic
      const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
      if (!subtopic) {
        console.log(`Subtopic not found for subtopic_id: ${subtopic_id}`);
        return; // Skip this row if subtopic is not found
      }

      // Check if utils[type] exists and find the section
      if (!subtopic.utils || !subtopic.utils[type]) {
        console.log(`Utils or type not found for type: ${type}`);
        return; // Skip if utils[type] does not exist
      }

      const section = subtopic.utils[type].find((t) => t.title_id == title_id);
      if (!section) {
        console.log(`Section not found for title_id: ${title_id}`);
        return; // Skip if section is not found
      }

      // Create the new question object
      const newQuestion = {
        question_id: section.questions.length + 1,
        question: question,
        options: [
          option_1,
          option_2,
          option_3,
          option_4
        ],
        correct_option: correct_option,
        explanation: explanation,
      };

      // Add the new question to the section
      section.questions.push(newQuestion);
    });


    console.log(topics);
    

    writeTopicsFile(topics); // Save updated topics

    res.status(200).json({ message: "Bulk questions added successfully." });
  } catch (error) {
    console.error("Error processing bulk questions:", error);
    res.status(500).json({ error: "Failed to process bulk questions." });
  }
});

app.get("/download/sample-format", (req, res) => {
  const filePath = path.join(__dirname, "sample_format.xlsx"); // Adjust the path if needed

  // Send the file to the client
  res.download(filePath, "sample_format.xlsx", (err) => {
    if (err) {
      console.error("Error downloading sample format file:", err);
      res.status(500).json({ error: "Failed to download sample format file." });
    }
  });
});

app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
