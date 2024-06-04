const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjust the path as necessary to match the deployment environment
const dbPath = path.resolve(__dirname, '..', '..', 'schema.db');
const db = new sqlite3.Database(dbPath);

exports.handler = async (event, context) => {
  const studentId = event.queryStringParameters.studentId;

  try {
    const takenCourses = await new Promise((resolve, reject) => {
      db.all(`SELECT course_id, course_name, elective_type FROM taken_courses WHERE student_id = ?`, [studentId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(takenCourses),
    };
  } catch (error) {
    console.error('Error fetching taken courses:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
