const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises; // Use promises for better async handling
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Path to the initiatives JSON file
const INITIATIVES_FILE = path.join(__dirname, 'data', 'initiatives.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
// Helper function to read initiatives from the JSON file
async function readInitiatives() {
  try {
    const data = await fs.readFile(INITIATIVES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return an empty array
      return [];
    }
    throw error;
  }
}

// Helper function to write initiatives to the JSON file
async function writeInitiatives(initiatives) {
  await fs.writeFile(INITIATIVES_FILE, JSON.stringify(initiatives, null, 2), 'utf8');
}
app.get('/api/initiatives', async (req, res) => {
  try {
    const initiatives = await readInitiatives();
    res.json(initiatives);
  } catch (error) {
    console.error('Error reading initiatives:', error);
    res.status(500).send('Failed to fetch initiatives.');
  }
});
// Route to add a new initiative
app.post('/api/initiatives', async (req, res) => {
  const newInitiative = req.body;

  try {
    // Validate the input (basic validation)
    if (!newInitiative.name || !newInitiative.provider || !newInitiative.start || !newInitiative.end) {
      return res.status(400).send('Invalid initiative data.');
    }

    // Read existing initiatives
    const initiatives = await readInitiatives();

    // Add the new initiative
    initiatives.push(newInitiative);

    // Write updated initiatives back to the file
    await writeInitiatives(initiatives);

    res.status(201).send('Initiative added successfully.');
  } catch (error) {
    console.error('Error saving initiative:', error);
    res.status(500).send('Failed to save initiative.');
  }
});
//Helper function to read users from the JSON file
async function readUsers(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    // Check if the file is empty
    if (!data.trim()) {
      return []; // Return an empty array if the file is empty
    }
    // Parse the JSON data
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return an empty array
      return [];
    }
    console.error('Error reading file:', error.message);
    throw error; // Re-throw the error for debugging purposes
  }
}
// Helper function to write users to the JSON file
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Route to register a new user
app.post('/api/users', async (req, res) => {
  const newUser = req.body;

  try {
    // Validate the input (basic validation)
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.birthday) {
      return res.status(400).send('Invalid user data.');
    }

    // Read existing users
    const users = await readUsers(USERS_FILE);

    // Check if email is already registered
    const emailExists = users.some(user => user.email === newUser.email);
    if (emailExists) {
      return res.status(400).send('Email already registered.');
    }

    // Add the new user with default role as volunteer
    newUser.role = 'volunteer';
    users.push(newUser);

    // Write updated users back to the file
    await writeUsers(users);

    res.status(201).send('User registered successfully. please login at new email');
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).send('Failed to save user.');
  }
});
app.get('/test-read-users', async (req, res) => {
  try {
    const users = await readUsers(USERS_FILE);
    res.json(users);
  } catch (error) {
    console.error('Error testing read users:', error);
    res.status(500).send('Failed to read users.');
  }
});
// Route to handle user with role organizers

app.get('/api/users/organizers', async (req, res) => {
  try {
    const users = await readUsers(USERS_FILE);
    const organizers = users.filter(user => user.role === 'organizer');
    res.json(organizers);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).send('Failed to fetch organizers.');
  }
});
// Route to update an initiative
app.post('/api/initiatives/:id', async (req, res) => {
  const initiativeId = parseInt(req.params.id);
  const { organizer } = req.body; // Organizer name from the frontend

  try {
    // Read existing initiatives
    const initiatives = await readInitiatives()

    // Find the initiative by ID
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) {
      return res.status(404).send('Initiative not found.');
    }

    // Update the organizer field
    initiative.organizer = organizer;

    // Write updated initiatives back to the file
    await writeInitiatives(initiatives);

    res.status(200).send('Initiative updated successfully.');
  } catch (error) {
    console.error('Error updating initiative:', error);
    res.status(500).send('Failed to update initiative.');
  }
});

app.get('/api/initiatives/organizer/:name', async (req, res) => {
  const organizerName = req.params.name;

  try {
    // Read existing initiatives
    const initiatives = await readInitiatives();

    // Filter initiatives by organizer name (case-insensitive)
    const filteredInitiatives = initiatives.filter(initiative =>
      initiative.organizer?.toLowerCase() === organizerName.toLowerCase()
    );

    res.json(filteredInitiatives);
  } catch (error) {
    console.error('Error fetching initiatives by organizer:', error);
    res.status(500).send('Failed to fetch initiatives.');
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});