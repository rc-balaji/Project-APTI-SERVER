//packages

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");

const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ dest: "uploads/" });

const xlsx = require("xlsx");

// UTILS

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Log request and data
const logRequest = (req) => {
  console.log(`Request Method: ${req.method}`);
  console.log(`Request URL: ${req.originalUrl}`);
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  console.log(`Request Query: ${JSON.stringify(req.query)}`);
};

//CONSTANTS

const usersFilePath = "./user.json";
var PORT = 4000;

// SETTER and GETTERS

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

const getUserName = (user_id) => {
  const users = readUsersData();
  const user = users.find((user) => user.user_id == user_id);

  return user.name;
};

//API

//Profile

app.get("/api/users/:user_id", (req, res) => {
  const { user_id } = req.params;
  const users = readUsersData();
  const user = users.find((user) => user.user_id === user_id);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

app.post("/api/users/:user_id/update", (req, res) => {
  const { user_id } = req.params;
  const updatedData = req.body;

  let users = readUsersData();
  const userIndex = users.findIndex((user) => user.user_id === user_id);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData };
    saveUsersData(users); // Function to save updated data back to the file
    res.status(200).json({ message: "User updated successfully." });
  } else {
    res.status(404).json({ message: "User not found." });
  }
});

// LOGIN

// login.html

app.post("/login", (req, res) => {
  try {
    console.log("Login");
    const { email, password } = req.body;

    console.log(email, password);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = readUsersData();
    // console.log(users);

    const user = users.find((u) => {
      console.log(u.email, u.password);

      console.log(email, password);

      console.log(email == u.email && password == u.password);

      return u.email == email && u.password == password;
    });

    console.log(user);

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

// Function to generate a unique user ID
function generateUniqueUserId(users) {
  let userId;
  let isUnique = false;

  while (!isUnique) {
    userId = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generate a 9-digit numeric ID
    isUnique = !users.find((u) => u.user_id === userId); // Check if the ID is unique
  }

  return userId;
}

app.post("/admin-register", (req, res) => {
  try {
    console.log("Admin Register");

    const {
      name = null,
      phone_number = null,
      email = null,
      password = null,
      dob = null,
      city = null,
      state = null,
      country = null,
      role = null,
    } = req.body;

    const users = readUsersData();

    // Check if the user with this email already exists
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const user = {
      user_id: generateUniqueUserId(users), // Generate a unique user ID
      name,
      phone_number,
      email,
      password,
      dob,
      city,
      state,
      country,
      role,
      topics: [],
    };

    users.push(user);
    saveUsersData(users);
    res.status(201).json({
      message: `Registration successful, redirecting to ${
        role || "user"
      } page.`,
    });
  } catch (error) {
    console.error("Error in /admin-register:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// home_page admin.html

// Dashboard Stats Endpoint
app.get("/dashboard-stats", (req, res) => {
  try {
    // Read the users.json and topics.json files
    const usersData = readUsersData(); // Assuming readUsersData() returns the users array
    const topicsData = readTopicsFile(); // Assuming readTopicsFile() returns the topics array

    if (!usersData || !topicsData) {
      return res.status(500).json({ error: "Error reading data from files." });
    }

    // Calculate statistics based on users and topics data
    const totalUsers = usersData.filter((user) => user.role === "user").length; // Users with 'user' role
    const totalSubAdmins = usersData.filter(
      (user) => user.role === "subadmin"
    ).length; // Users with 'subadmin' role
    const totalCourses = topicsData.length; // Total number of topics in topics.json
    const totalTestsAttempted = usersData.reduce(
      (acc, user) => acc + (user.test_history ? user.test_history.length : 0), // Count tests attempted by each user
      0
    );
    const activeUsers = usersData.filter((user) => user.isActive).length; // Count active users (if isActive field exists)

    // Respond with the computed statistics
    return res.json({
      totalUsers,
      totalSubAdmins,
      totalCourses,
      totalTestsAttempted,
      activeUsers,
    });
  } catch (err) {
    console.error(`Error processing data: ${err}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// new_subadmin.html

// 1. /admin-register
app.get("/get-subadmins", (req, res) => {
  try {
    const users = readUsersData();
    const subAdmins = users.filter((user) => user.role === "subadmin");
    res.status(200).json(subAdmins);
  } catch (error) {
    console.error("Error in /get-subadmins:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// edit_subadmin.html

app.put("/edit-subadmin/:id", (req, res) => {
  try {
    console.log("Edit Subadmin");
    const { id } = req.params;
    const {
      name = null,
      phone_number = null,
      email = null,
      password = null,
      dob = null,
      city = null,
      state = null,
      country = null,
    } = req.body;

    const users = readUsersData();

    // Find the subadmin to update
    const subAdmin = users.find(
      (user) => user.user_id === id && user.role === "subadmin"
    );

    if (!subAdmin) {
      return res.status(404).json({ error: "Subadmin not found" });
    }

    // Update the subadmin's details
    subAdmin.name = name || subAdmin.name;
    subAdmin.phone_number = phone_number || subAdmin.phone_number;
    subAdmin.email = email || subAdmin.email;
    subAdmin.password = password || subAdmin.password;
    subAdmin.dob = dob || subAdmin.dob;
    subAdmin.city = city || subAdmin.city;
    subAdmin.state = state || subAdmin.state;
    subAdmin.country = country || subAdmin.country;

    saveUsersData(users);
    res.status(200).json({ message: "Subadmin updated successfully" });
  } catch (error) {
    console.error("Error in /edit-subadmin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/delete-subadmin/:id", (req, res) => {
  try {
    console.log("Delete Subadmin");
    const { id } = req.params;

    console.log(id);

    const users = readUsersData();

    // Find the index of the subadmin to delete
    const index = users.findIndex(
      (user) => user.user_id === id && user.role === "subadmin"
    );

    if (index === -1) {
      return res.status(404).json({ error: "Subadmin not found" });
    }

    // Remove the subadmin from the array
    users.splice(index, 1);

    saveUsersData(users);
    res.status(200).json({ message: "Subadmin deleted successfully" });
  } catch (error) {
    console.error("Error in /delete-subadmin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

//--ADD CONTENT

//----EDIT CONTENT

//edit_content.html

app.get("/topic", (req, res) => {
  try {
    const topics = readTopicsFile();
    const topicList = topics.map(
      ({ topic_id, name, created_by, created_at }) => ({
        topic_id,
        name,
        created_by: getUserName(created_by),
        created_at,
      })
    );
    res.json(topicList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to Get Topic Details
app.get("/topic/:id", (req, res) => {
  const topicId = req.params.id;

  try {
    const topics = readTopicsFile();
    const topic = topics.find((topic) => topic.topic_id === topicId);

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to Edit Topic
app.put("/topic/:id", (req, res) => {
  const topicId = req.params.id;
  const { name } = req.body; // Expecting a new name for the topic

  try {
    const topics = readTopicsFile();
    const topicIndex = topics.findIndex((topic) => topic.topic_id === topicId);

    if (topicIndex === -1) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Update the topic name
    topics[topicIndex].name = name;

    // Save the updated topics list (you might write it to a file or a database)
    writeTopicsFile(topics);

    res.json({
      message: "Topic updated successfully",
      topic: topics[topicIndex],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to Delete Topic
app.delete("/topic/:id", (req, res) => {
  const topicId = req.params.id;

  try {
    const topics = readTopicsFile();
    const topicIndex = topics.findIndex((topic) => topic.topic_id === topicId);

    if (topicIndex === -1) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Remove the topic from the list
    topics.splice(topicIndex, 1);

    // Save the updated topics list (you might write it to a file or a database)
    writeTopicsFile(topics);

    res.json({ message: "Topic deleted successfully" });
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

//edit_subtopic.html

app.get("/subtopics", (req, res) => {
  try {
    const { topic_id } = req.query;
    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopicsList = topic.sub_topics.map(
      ({ subtopic_id, name, created_at, created_by }) => ({
        subtopic_id,
        name,
        created_at,
        created_by: getUserName(created_by),
      })
    );
    res.json(subtopicsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific subtopic by topic ID and subtopic ID
app.get("/topics/:topic_id/subtopics/:subtopic_id", (req, res) => {
  try {
    const { topic_id, subtopic_id } = req.params;
    const topics = readTopicsFile();

    // Find the topic by ID
    const topic = topics.find((t) => t.topic_id === topic_id);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Find the subtopic by ID within the topic
    const subtopic = topic.sub_topics.find(
      (st) => st.subtopic_id === subtopic_id
    );
    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    res.json({ name: subtopic.name || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or update the content of a subtopic by topic ID and subtopic ID
app.post("/topics/:topic_id/subtopics/:subtopic_id", (req, res) => {
  try {
    const { topic_id, subtopic_id } = req.params;
    const { name } = req.body;

    console.log(topic_id, subtopic_id, name);

    const topics = readTopicsFile();

    // Find the topic by ID
    const topic = topics.find((t) => t.topic_id === topic_id);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Find the subtopic by ID within the topic
    const subtopic = topic.sub_topics.find(
      (st) => st.subtopic_id === subtopic_id
    );
    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // Update the subtopic content
    subtopic.name = name;

    // Save changes to the file
    fs.writeFileSync(
      path.join(__dirname, "topics.json"),
      JSON.stringify(topics, null, 2)
    );

    res.json({ message: "Subtopic content updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a subtopic by topic ID and subtopic ID
app.delete("/topics/:topic_id/subtopics/:subtopic_id", (req, res) => {
  try {
    const { topic_id, subtopic_id } = req.params;
    const topics = readTopicsFile();

    // Find the topic by ID
    const topic = topics.find((t) => t.topic_id === topic_id);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    // Find the index of the subtopic by ID within the topic
    const subtopicIndex = topic.sub_topics.findIndex(
      (st) => st.subtopic_id === subtopic_id
    );
    if (subtopicIndex === -1) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // Remove the subtopic
    topic.sub_topics.splice(subtopicIndex, 1);

    // Save changes to the file
    fs.writeFileSync(
      path.join(__dirname, "topics.json"),
      JSON.stringify(topics, null, 2)
    );

    res.json({ message: "Subtopic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//edit_title.html

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
app.get("/get-title", (req, res) => {
  try {
    const { topic_id, subtopic_id, utils_type, title_id } = req.query;

    console.log("------", topic_id, subtopic_id, utils_type, title_id);

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

    let title = null;

    if (utils_type === "Practices") {
      title = subtopic.utils.Practices.find((t) => t.title_id === title_id);
    } else {
      title = subtopic.utils.Test.find((t) => t.title_id === title_id);
    }

    if (!title) {
      return res.status(404).send("Title not found");
    }

    console.log(title);

    res.json(title);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Title
app.put("/title/:id", (req, res) => {
  const { id } = req.params;
  const { topic_id, subtopic_id, type, newTitle } = req.body;

  console.log("PUT CALLLED - ", topic_id, subtopic_id, type, newTitle);

  let topics = readTopicsFile();

  // Find the topic by topic_id
  const topic = topics.find((t) => t.topic_id == topic_id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  // Find the subtopic within the topic
  const subtopic = topic.sub_topics.find((st) => st.subtopic_id == subtopic_id);
  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  // Validate utils type and process only for Practices and Test
  if (type !== "Practices" && type !== "Test") {
    return res.status(400).json({ error: "Invalid utils type specified" });
  }
  let title = null;

  if (type === "Practices") {
    title = subtopic.utils.Practices.find((t) => t.title_id === id);
  } else {
    title = subtopic.utils.Test.find((t) => t.title_id === id);
  }

  if (!title) {
    return res.status(404).send("Title not found");
  }

  title.title = newTitle;

  writeTopicsFile(topics);
  res.send({ message: "Title updated successfully", title: title });
});

// // Edit Title
// app.put("/title/:id", (req, res) => {
//   const { id } = req.params;
//   const { title, type } = req.body;

//   const titleToUpdate = titles.find(
//     (t) => t.title_id === id && t.type === type
//   );
//   if (!titleToUpdate) {
//     return res.status(404).send("Title not found");
//   }

//   titleToUpdate.title = title;
//   res.send({ message: "Title updated successfully", title: titleToUpdate });
// });

// Delete Title
// Delete Title
app.delete("/title/:id", (req, res) => {
  const { id } = req.params;
  const { topic_id, subtopic_id, type } = req.query; // Assuming type and IDs are passed as query params

  console.log("DELETE CALLED - ", topic_id, subtopic_id, type, id);

  let topics = readTopicsFile();

  // Find the topic by topic_id
  const topic = topics.find((t) => t.topic_id == topic_id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  // Find the subtopic within the topic
  const subtopic = topic.sub_topics.find((st) => st.subtopic_id == subtopic_id);
  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  // Validate utils type and process only for Practices and Test
  if (type !== "Practices" && type !== "Test") {
    return res.status(400).json({ error: "Invalid utils type specified" });
  }

  let titleList = null;

  if (type === "Practices") {
    titleList = subtopic.utils.Practices;
  } else {
    titleList = subtopic.utils.Test;
  }

  // Find the index of the title to be deleted
  const titleIndex = titleList.findIndex((t) => t.title_id === id);
  if (titleIndex === -1) {
    return res.status(404).send("Title not found");
  }

  // Remove the title from the list
  titleList.splice(titleIndex, 1);

  // Save changes back to the file
  writeTopicsFile(topics);
  res.send({ message: "Title deleted successfully" });
});

//----New Content

//new_content.html

// 1 .  '/topic'

// Function to generate a unique numeric topic ID
function generateUniqueTopicId(topics) {
  let topicId;
  let isUnique = false;

  while (!isUnique) {
    topicId = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generate a 6-digit numeric ID
    isUnique = !topics.find((t) => t.topic_id === topicId); // Check if the ID is unique
  }

  return topicId;
}

app.post("/add/topic", (req, res) => {
  console.log("Called");

  logRequest(req);
  try {
    const { user_id, topic_name } = req.body;

    if (!user_id || !topic_name) {
      return res
        .status(400)
        .json({ error: "User ID and Topic Name are required" });
    }

    const topics = readTopicsFile();
    const newTopic = {
      name: topic_name,
      topic_id: generateUniqueTopicId(topics), // Generate a unique topic ID
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

//new_questions_import.html

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
      if (i === 1) {
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
      } else {
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
          explanation: "",
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

function generateUniqueQuestionId(section) {
  let questionId;
  let isUnique = false;

  while (!isUnique) {
    questionId = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generate a 9-digit numeric ID
    isUnique = !section.questions.find((q) => q.question_id === questionId); // Check if the ID is unique
  }

  return questionId;
}
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
        explanation,
      } = row;

      console.log(
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
      );

      // Find the topic
      const topic = topics.find((t) => t.topic_id == topic_id);

      console.log(topic);

      if (!topic) {
        console.log(`Topic not found for topic_id: ${topic_id}`);
        return; // Skip this row if topic is not found
      }

      // Find the subtopic
      const subtopic = topic.sub_topics.find(
        (s) => s.subtopic_id == subtopic_id
      );
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
        question_id: generateUniqueQuestionId(section),
        question: question,
        options: [option_1, option_2, option_3, option_4],
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

//new_questions.html

// 1. /questions/:title_id

// Function to generate a unique 9-digit question ID

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
      question_id: generateUniqueQuestionId(section), // Generate a unique question ID
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

app.post("/update/questions", (req, res) => {
  const {
    question_id,
    topic_id,
    subtopic_id,
    title_id,
    question,
    options,
    correct_option,
    explanation,
    type,
  } = req.body;

  const topics = readTopicsFile();
  const topic = topics.find((t) => t.topic_id == topic_id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  const section = subtopic.utils[type].find(
    (item) => item.title_id == title_id
  );
  if (!section) return res.status(404).json({ error: "Section not found" });

  const questionToUpdate = section.questions.find(
    (q) => q.question_id == question_id
  );
  if (!questionToUpdate)
    return res.status(404).json({ error: "Question not found" });

  questionToUpdate.question = question;
  questionToUpdate.options = options;
  questionToUpdate.correct_option = correct_option;
  questionToUpdate.explanation = explanation;

  writeTopicsFile(topics);
  res.status(200).json({
    message: "Question updated successfully",
    updated_question: questionToUpdate,
  });
});

app.delete("/delete/questions", (req, res) => {
  const { question_id, topic_id, subtopic_id, title_id, type } = req.body;

  const topics = readTopicsFile();
  const topic = topics.find((t) => t.topic_id == topic_id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  const section = subtopic.utils[type].find(
    (item) => item.title_id == title_id
  );
  if (!section) return res.status(404).json({ error: "Section not found" });

  const questionIndex = section.questions.findIndex(
    (q) => q.question_id == question_id
  );
  if (questionIndex === -1)
    return res.status(404).json({ error: "Question not found" });

  section.questions.splice(questionIndex, 1);

  writeTopicsFile(topics);
  res.status(200).json({ message: "Question deleted successfully" });
});

//new_subtopic.html

// 1. /subtopics

// Function to generate a unique 9-digit subtopic ID
function generateUniqueSubtopicId(topic) {
  let subtopicId;
  let isUnique = false;

  while (!isUnique) {
    subtopicId = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generate a 9-digit numeric ID
    isUnique = !topic.sub_topics.find((s) => s.subtopic_id === subtopicId); // Check if the ID is unique
  }

  return subtopicId;
}

app.post("/add/topic/:topic_id/subtopics", (req, res) => {
  logRequest(req);
  try {
    const { user_id, subtopic_name } = req.body;
    const { topic_id } = req.params;

    // Read topics from file
    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // Create a new subtopic with a unique ID
    const newSubtopic = {
      name: subtopic_name,
      subtopic_id: generateUniqueSubtopicId(topic), // Generate a unique subtopic ID
      created_by: user_id,
      created_at: new Date().toLocaleString(),
      utils: {
        Learning_Materials: { contents: "" },
        Practices: [],
        Test: [],
      },
    };

    // Add the new subtopic to the topic
    topic.sub_topics.push(newSubtopic);
    writeTopicsFile(topics);

    // Respond with the new subtopic
    res.status(201).json(newSubtopic);
  } catch (err) {
    console.error("Error adding subtopic:", err);
    res
      .status(500)
      .json({ error: "An error occurred while adding the subtopic" });
  }
});

//new_title.html

// 1 . /title

// Function to generate a unique 9-digit title ID
function generateUniqueTitleId(section) {
  let titleId;
  let isUnique = false;

  while (!isUnique) {
    titleId = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generate 9-digit numeric ID
    isUnique = !section.find((item) => item.title_id === titleId); // Ensure ID is unique within the section
  }

  return titleId;
}

// Endpoint to add content to a subtopic (learning materials, practices, or tests)
app.post("/add/topic/:topic_id/subtopics/:subtopic_id", (req, res) => {
  logRequest(req);
  try {
    const { user_id } = req.body;
    const { topic_id, subtopic_id } = req.params;
    const body = req.body;

    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    if (body.type === "Practices" || body.type === "Test") {
      const newbody = {
        title: body.title,
        title_id: generateUniqueTitleId(
          body.type === "Practices"
            ? subtopic.utils.Practices
            : subtopic.utils.Test
        ), // Generate a unique 9-digit title ID
        questions: [],
      };

      if (body.type === "Practices") {
        subtopic.utils.Practices.push(newbody);
      } else {
        subtopic.utils.Test.push(newbody);
      }
    } else {
      subtopic.utils.Learning_Materials.contents = body.content;
    }

    writeTopicsFile(topics);
    res.status(200).json(subtopic);
  } catch (err) {
    console.error("Error adding content:", err);
    res.status(500).json({ error: err.message });
  }
});

//-Allocate Course
//----Allocate for Subadmin

//allocate_subadmin.html
app.get("/users", (req, res) => {
  try {
    const { role } = req.query;
    const users = readUsersData();
    const filteredUsers = users.filter((user) => user.role === role);
    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/user-topics", (req, res) => {
  try {
    const { user_id } = req.query;
    const users = readUsersData();
    const user = users.find((u) => u.user_id === user_id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.topics || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

// Allocate topics to a user
app.post("/allocate", (req, res) => {
  const { user_id, topics } = req.body;

  console.log(topics);

  const users = readUsersData();
  const user = users.find((u) => u.user_id === user_id);

  if (user) {
    user.topics = topics.map((topic_id) => {
      const topic = readTopicsFile().find((t) => t.topic_id === topic_id);
      return {
        topic_id: topic.topic_id,
        name: topic.name,
        created_by: getUserName(topic.created_by),
        created_at: topic.created_at,
      };
    });
    saveUsersData(users);
    res.status(200).json({ message: "Topics allocated successfully" });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

//--------------USERS

//start_test

// Endpoint: Start-Test
app.post("/start-test", (req, res) => {
  const payload = req.body;

  console.log(payload);

  try {
    const usersData = readUsersData();

    console.log("TP-1", usersData);

    // Find the user
    const user = usersData.find((user) => payload.user_id == user.user_id);

    console.log("TP-2", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("TP-3", user);

    user.test_history.push(payload);

    saveUsersData(usersData);
    res.status(200).json({ message: "Test started successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error starting test", error: error.message });
  }
});

// Endpoint: Finish-Test
app.post("/finish-test", (req, res) => {
  const payload = req.body;

  console.log(payload);

  try {
    const usersData = readUsersData();

    console.log("TP-1", usersData);

    // Find the user
    const user = usersData.find((user) => payload.user_id == user.user_id);

    console.log("TP-2", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("TP-3", user);

    user.test_history.push(payload);

    saveUsersData(usersData);
    res.status(200).json({ message: "Test started successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error starting test", error: error.message });
  }
});

// user_register.html
app.post("/register", (req, res) => {
  try {
    console.log("Register");

    // Destructure the incoming request body, with default values set to null for optional fields
    const {
      name = null,
      phone_number = null,
      email = null,
      password = null,
      dob = null,
      city = null,
      state = null,
      country = null,
    } = req.body;

    // Check if any required field is missing
    if (
      !name ||
      !phone_number ||
      !email ||
      !password ||
      !dob ||
      !city ||
      !state ||
      !country
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const users = readUsersData();
    const existingUser = users.find((u) => u.email === email);

    // Check if the email already exists
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Create a new user object with the provided data
    const user = {
      user_id: generateUniqueUserId(users),
      name,
      phone_number, // Include the phone number here
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

    // Push the new user into the array and save the data
    users.push(user);
    saveUsersData(users);

    // Send response back indicating registration success
    res.status(201).json({
      message: "Registration successful, redirecting to user page.",
      role: "user",
    });
  } catch (error) {
    console.error("Error in /register:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// questions.html

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

//content.html

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

app.post("/contents", (req, res) => {
  try {
    const { topic_id, subtopic_id, content } = req.body;
    const topics = readTopicsFile();
    const topic = topics.find((t) => t.topic_id == topic_id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const subtopic = topic.sub_topics.find((s) => s.subtopic_id == subtopic_id);
    if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

    subtopic.utils.Learning_Materials.contents = content;

    writeTopicsFile(topics);
    res.json({ message: "Content updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Listener

app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
