const HTTP_PORT = process.env.PORT || 3000;
const express = require("express");
const exphbs = require('express-handlebars');
const path = require("path");
const app = express();
const lineByLine = require('linebyline');
const bodyParser = require('body-parser');
const imageListReader = require('./imageListReader');
const fs = require('fs');
const session = require('client-sessions');

// Configure client-sessions middleware
app.use(session({
  cookieName: 'session',
  secret: 'jwdhg234#5.*fQEE$67324b.', 
  duration: 60 * 60 * 1000, // 60 minutes
  activeDuration: 30 * 60 * 1000, // 30 minutes
}));


app.use(bodyParser.urlencoded({ extended: true }));

app.engine("hbs", exphbs({
  extname: "hbs",
  defaultLayout: false
}));

app.set("view engine", "hbs");
app.use(express.static('public'));


const imageList = imageListReader.readImageList();

// By default, we display image of bicycle
// Route to render our main gallery page
app.get('/home', (req, res) => {
  // Check if the user is authenticated (logged in)
  if (req.session && req.session.user) {
    res.render('Home', { pageTitle: 'Gallery App', username: req.session.user, imageList, defaultImage: '/images/bicycle.jpg' });
  } else {
    // Redirect to the login page if not authenticated
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.reset(); // Clear session data
  res.redirect('/'); // Redirect to the login page
});


// Handle image submission
app.post('/submit', (req, res) => {
  const selectedImage = req.body.image;
  const imagePath = '/images/'+selectedImage;
  
  res.render('Home', { pageTitle: 'Gallery App', username: req.session.user, imageList, defaultImage: imagePath });
});

// Route to render the login page
app.get('/', (req, res) => {
  res.render('Login', { pageTitle: 'Gallery App', errorMessage: "" });
  
});

// Route to handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const userFilePath = path.join(__dirname, 'user.json');

  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const users = JSON.parse(data);
    
    if (users[username] && users[username] === password) {
      // Successful login, set up session
      req.session.user = username;
      res.redirect('/Home'); // Redirect to gallery page
    } else if (!users[username]) {
      req.session.errorMessage = 'Not a registered username';
      res.redirect('/');
    } else {
      req.session.errorMessage = 'Invalid password';
      res.redirect('/');
    }
  });
});

// Route to render the registration page
app.get('/register', (req, res) => {
  res.render('Register', { pageTitle: 'Gallery App', errorMessage: req.session.errorMessage });
  req.session.errorMessage = null; // Reset error message after rendering
});

// Route to handle registration form submission
app.post('/register', (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Validate the entered credentials
  if (!email || !password || password !== confirmPassword) {
    req.session.errorMessage = 'Invalid registration details';
    res.redirect('/register');
    return;
  }

  const userFilePath = path.join(__dirname, 'user.json');

  // Read existing users from user.json
  fs.readFile(userFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading user.json:', err);
      return res.status(500).send('Internal Server Error');
    }

    const users = JSON.parse(data);

    // Check if the email is already registered
    if (users[email]) {
      req.session.errorMessage = 'Email is already registered';
      res.redirect('/register');
      return;
    }

    // Add the new user to the users object
    users[email] = password;

    // Update user.json with the new user information
    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing user.json:', writeErr);
        return res.status(500).send('Internal Server Error');
      }

      // Successful registration, redirect to login page
      res.redirect('/');
    });
  });
});


app.listen(HTTP_PORT, () => {
  console.log(`Server is running on port ${HTTP_PORT} (http://localhost:3000)`);
});
