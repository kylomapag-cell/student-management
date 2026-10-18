# Student Management System

A simple web-based Student Management System developed using:
- Node.js
- Express.js
- EJS
- MySQL
- Git
- GitHub

## Features
- View students
- Add students
- Edit students
- Delete students
- Search students
- Form validation

## Installation

Clone the repository:
```bash
git clone https://github.com/kylomapag-cell/student-management.git 
```

Install dependencies:
```bash
npm install
```

Create the database:
Open phpMyAdmin or MySQL CLI and run:
```sql
CREATE DATABASE student_management;
USE student_management;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  course VARCHAR(100) NOT NULL,
  year_level INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students
(student_id, first_name, last_name, course, year_level, email)
VALUES
('2026-0001', 'Juan', 'Dela Cruz', 'BS Information Technology', 3, 'juan@example.com'),
('2026-0002', 'Maria', 'Santos', 'BS Information Technology', 3, 'maria@example.com'),
('2026-0003', 'Pedro', 'Reyes', 'BS Computer Science', 2, 'pedro@example.com');
```

Configure the database connection:
Create a `.env` file in the project root:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=student_management
```

Run:
```bash
node app.js
```

Open:
```
http://localhost:3000
```
