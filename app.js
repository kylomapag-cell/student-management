require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();

// Database connection configuration using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_management'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL Database: ' + (process.env.DB_NAME || 'student_management'));
});

// Configure Express
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Helper function: Input validation
function validateStudent(data) {
  const { student_id, first_name, last_name, course, year_level, email } = data;

  if (!student_id || !first_name || !last_name || !course || !year_level || !email) {
    return 'All fields are required.';
  }

  if (student_id.trim() === '') {
    return 'Student ID cannot be empty.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }

  const yearNum = parseInt(year_level, 10);
  if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
    return 'Year level must be a number between 1 and 5.';
  }

  return null;
}

// 1. Student List Route (View all students)
app.get('/', (req, res) => {
  db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Database error in GET /:', err);
      return res.status(500).send('Database error: Unable to retrieve students.');
    }
    res.render('index', {
      students: results,
      keyword: ''
    });
  });
});

// 2. Student Search Route (Search by student_id, first_name, last_name, course)
app.get('/students/search', (req, res) => {
  const keyword = (req.query.keyword || '').trim();

  if (keyword === '') {
    return res.redirect('/');
  }

  const sql = `
    SELECT * FROM students
    WHERE student_id LIKE ?
       OR first_name LIKE ?
       OR last_name LIKE ?
       OR course LIKE ?
    ORDER BY id DESC
  `;
  const searchValue = `%${keyword}%`;

  db.query(
    sql,
    [searchValue, searchValue, searchValue, searchValue],
    (err, results) => {
      if (err) {
        console.error('Database error in GET /students/search:', err);
        return res.status(500).send('Database error: Search query failed.');
      }
      res.render('index', {
        students: results,
        keyword: keyword
      });
    }
  );
});

// 3. Add Student Form Route
app.get('/students/add', (req, res) => {
  res.render('add', {
    error: null,
    formData: {}
  });
});

// 4. Process Add Student Form
app.post('/students/add', (req, res) => {
  const {
    student_id,
    first_name,
    last_name,
    course,
    year_level,
    email
  } = req.body;

  const validationError = validateStudent(req.body);
  if (validationError) {
    return res.status(400).render('add', {
      error: validationError,
      formData: req.body
    });
  }

  // Check for unique student_id
  const checkSql = 'SELECT id FROM students WHERE student_id = ?';
  db.query(checkSql, [student_id.trim()], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking duplicate student ID:', checkErr);
      return res.status(500).send('Database error during validation.');
    }

    if (checkResults.length > 0) {
      return res.status(400).render('add', {
        error: `Student ID "${student_id}" is already registered. Please use a unique Student ID.`,
        formData: req.body
      });
    }

    const insertSql = `
      INSERT INTO students
      (student_id, first_name, last_name, course, year_level, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student_id.trim(),
      first_name.trim(),
      last_name.trim(),
      course.trim(),
      parseInt(year_level, 10),
      email.trim()
    ];

    db.query(insertSql, values, (insertErr) => {
      if (insertErr) {
        console.error('Error inserting student:', insertErr);
        return res.status(500).send('Unable to save student');
      }
      res.redirect('/');
    });
  });
});

// 5. Edit Student Form Route
app.get('/students/edit/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM students WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Database error in GET /students/edit/:id:', err);
      return res.status(500).send('Database error');
    }
    if (results.length === 0) {
      return res.status(404).send('Student not found');
    }
    res.render('edit', {
      student: results[0],
      error: null,
      formData: {}
    });
  });
});

// 6. Process Edit Student Form
app.post('/students/edit/:id', (req, res) => {
  const { id } = req.params;
  const {
    student_id,
    first_name,
    last_name,
    course,
    year_level,
    email
  } = req.body;

  const validationError = validateStudent(req.body);
  if (validationError) {
    return res.status(400).render('edit', {
      student: { id, ...req.body },
      error: validationError,
      formData: req.body
    });
  }

  // Ensure updated student_id is unique across other students
  const checkSql = 'SELECT id FROM students WHERE student_id = ? AND id != ?';
  db.query(checkSql, [student_id.trim(), id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking duplicate student ID:', checkErr);
      return res.status(500).send('Database error during validation.');
    }

    if (checkResults.length > 0) {
      return res.status(400).render('edit', {
        student: { id, ...req.body },
        error: `Student ID "${student_id}" is already used by another student.`,
        formData: req.body
      });
    }

    const updateSql = `
      UPDATE students
      SET student_id = ?, first_name = ?, last_name = ?, course = ?, year_level = ?, email = ?
      WHERE id = ?
    `;

    const values = [
      student_id.trim(),
      first_name.trim(),
      last_name.trim(),
      course.trim(),
      parseInt(year_level, 10),
      email.trim(),
      id
    ];

    db.query(updateSql, values, (updateErr) => {
      if (updateErr) {
        console.error('Error updating student:', updateErr);
        return res.status(500).send('Unable to update student');
      }
      res.redirect('/');
    });
  });
});

// 7. Delete Student Route (Safe POST method with parameterized query)
app.post('/students/delete/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM students WHERE id = ?';

  db.query(sql, [id], (err) => {
    if (err) {
      console.error('Database error in POST /students/delete/:id:', err);
      return res.status(500).send('Unable to delete student');
    }
    res.redirect('/');
  });
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
