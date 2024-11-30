//packages

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");



// UTILS

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());


//CONSTANTS

const usersFilePath = "./user.json";
var PORT = 4000;



// SETTER and GETTERS





//API

// LOGIN 

// login.html

app.post("/login", (req, res) => {
    try {
      console.log("Login");
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      const users = readUsersData();
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
  
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      // Send back user data without redirecting HTML pages
      res.json({
        message: "Login successful",
        user_id: user.user_id,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      console.error("Error in /login:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });


// ADMIN 

// admin.html


// register.html

app.post("/admin-register", (req, res) => {
  try {
    console.log("Admin Register");
    const { name, email, password, dob, city, state, country, role } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !dob ||
      !city ||
      !state ||
      !country ||
      !role
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (role !== "admin" && role !== "subadmin") {
      return res.status(400).json({ error: "Invalid role" });
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
      role,
      email,
      password,
      dob,
      city,
      state,
      country,
      topics: [],
    };

    users.push(user);
    saveUsersData(users);
    res.status(201).json({
      message: `Registration successful, redirecting to ${role} page.`,
    });
  } catch (error) {
    console.error("Error in /admin-register:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

//--ADD CONTENT

//----EDIT CONTENT


//edit_content.html

app.get("/topic", (req, res) => {
    try {
      const topics = readTopicsFile();
      const topicList = topics.map(({ topic_id, name }) => ({ topic_id, name }));
      res.json(topicList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  

app.post("/add/topic", (req, res) => {
    console.log("Called");
  
    logRequest(req);
    try {
      const { user_id, topic_name } = req.body;
      const topics = readTopicsFile();
      const newTopic = {
        name: topic_name,
        topic_id: topics.length + 1,
        created_by: user_id,
        created_at: new Date().toLocaleString(),
        sub_topics: [],
      };
      topics.push(newTopic);
      writeTopicsFile(topics);
      res.status(201).json(newTopic);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });



//edit_questions.html


app.get("/questions/:title_id", (req, res) => {
    logRequest(req);
    try {
      const { topic_id, subtopic_id, utils } = req.query;
      const { title_id } = req.params;
      const topics = readTopicsFile();
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
      if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });
  
      if (utils === "content") {
        return res.json({ content: subtopic.utils.Learning_Materials.contents });
      } else if (utils === "Practices" || utils === "Test") {
        if (title_id) {
          const item = subtopic.utils[utils].find((u) => u.title_id == title_id);
          if (!item) return res.status(404).json({ error: "Title not found" });
          return res.json(item); // Return the entire object for the specific title_id
        } else {
          return res.json(subtopic.utils[utils]); // Return all objects for the utility type
        }
      } else {
        return res.status(400).json({ error: "Invalid utility type" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  
app.post("/add/questions", (req, res) => {
    logRequest(req);
    try {
      const {
        topic_id,
        subtopic_id,
        title_id,
        question,
        options,
        correct_option,
        explanation,
        type,
      } = req.body;
      // const { topic_id, subtopic_id, question_id } = req.params;
  
      // Read the topics data from file
      const topics = readTopicsFile();
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      // Find the subtopic within the topic
      const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
  
      if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });
  
      // Find the relevant section (Practices or Test)
      const section = subtopic.utils[type].find(
        (item) => item.title_id == title_id
      );
  
      if (!section)
        return res.status(404).json({ error: `${type} section not found` });
  
      // Create new question with a unique question_id
      const newQuestion = {
        question_id: section.questions.length + 1,
        question: question,
        options: options,
        correct_option: correct_option,
        explanation: explanation,
      };
  
      // Add the new question to the section
      section.questions.push(newQuestion);
  
      // Write the updated topics back to the file
      writeTopicsFile(topics);
  
      // Respond with the updated section
      res.status(200).json({
        message: "Question added successfully",
        updated_section: section,
      });
    } catch (err) {
      console.error("Error adding question:", err);
      res
        .status(500)
        .json({ error: "An error occurred while adding the question" });
    }
  });

//edit_subtopic.html

// Endpoint to add a new subtopic to a topic
app.post("/add/topic/:topic_id/subtopics", (req, res) => {
    logRequest(req);
    try {
      const { user_id, subtopic_name } = req.body;
      const { topic_id } = req.params;
      const topics = readTopicsFile();
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      const newSubtopic = {
        name: subtopic_name,
        subtopic_id: topic.sub_topics.length + 1,
        created_by: user_id,
        created_at: new Date().toLocaleString(),
        utils: {
          Learning_Materials: { contents: "" },
          Practices: [],
          Test: [],
        },
      };
      topic.sub_topics.push(newSubtopic);
      writeTopicsFile(topics);
      res.status(201).json(newSubtopic);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Endpoint to get all subtopics by topic_id
app.get("/subtopics", (req, res) => {
    try {
      const { topic_id } = req.query;
      const topics = readTopicsFile();
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      const subtopicsList = topic.sub_topics.map(({ subtopic_id, name }) => ({
        subtopic_id,
        name,
      }));
      res.json(subtopicsList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

//edit_title.html

// Endpoint to get all titles by topic_id, subtopic_id, and utils type
app.get("/title", (req, res) => {
    try {
      const { topic_id, subtopic_id, utils_type } = req.query;
  
      console.log(topic_id, subtopic_id, utils_type);
  
      let topics = readTopicsFile();
  
      // Find the topic by topic_id
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      // Find the subtopic within the topic
      const subtopic = topic.sub_topics.find(
        (st) => st.subtopic_id == subtopic_id
      );
      if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });
  
      // Validate utils type and process only for Practices and Test
      if (utils_type !== "Practices" && utils_type !== "Test") {
        return res.status(400).json({ error: "Invalid utils type specified" });
      }
  
      // Extract titles based on the utils type
      let titlesList = [];
      if (utils_type === "Practices") {
        titlesList = subtopic.utils.Practices.map(({ title, title_id }) => ({
          title,
          title_id,
        }));
      } else if (utils_type === "Test") {
        titlesList = subtopic.utils.Test.map(({ title, title_id }) => ({
          title,
          title_id,
        }));
      }
  
      res.json(titlesList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // Endpoint to add content to a subtopic (learning materials, practices, or tests)
app.post("/add/topic/:topic_id/subtopics/:subtopic_id", (req, res) => {
    logRequest(req);
    try {
      const { user_id } = req.body;
      const { topic_id, subtopic_id } = req.params;
      const body = req.body;
  
      // console.log(t);
  
      const topics = readTopicsFile();
      const topic = topics.find((t) => t.topic_id == topic_id);
      if (!topic) return res.status(404).json({ error: "Topic not found" });
  
      const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
      if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });
  
      if (body.type === "Practices" || body.type === "Test") {
        const newbody = {
          title: body.title,
        };
        if (body.type === "Practices") {
          newbody.title_id = subtopic.utils.Practices.length + 1;
          newbody.questions = [];
          subtopic.utils.Practices.push(newbody);
        } else {
          newbody.title_id = subtopic.utils.Test.length + 1;
          newbody.questions = [];
          subtopic.utils.Test.push(newbody);
        }
      } else {
        subtopic.utils.Learning_Materials.contents = body.content;
      }
  
      writeTopicsFile(topics);
      res.status(200).json(subtopic);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  //----New Content

//new_content.html

// 1 .  '/topic'

//2 .  '/add/topic'

//new_questions_import.html


//new_questions.html

//new_subtopic.html


//new_title.html













