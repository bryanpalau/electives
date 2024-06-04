const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjust the path to ensure it's relative to the function's location
const dbPath = path.resolve(__dirname, '../../schema.db');
const db = new sqlite3.Database(dbPath);

exports.handler = async (event, context) => {
  const studentId = event.path.split('/').pop();

  try {
    const student = await new Promise((resolve, reject) => {
      db.get(`SELECT student_id FROM students WHERE student_id = ?`, [studentId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ exists: !!student }),
    };
  } catch (error) {
    console.error('Error fetching student ID:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
