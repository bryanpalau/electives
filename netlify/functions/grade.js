const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjust the path to ensure it's relative to the function's location
const dbPath = path.resolve(__dirname, '../../schema.db');
const db = new sqlite3.Database(dbPath);

exports.handler = async (event, context) => {
  const { studentId, courseId } = event.queryStringParameters;

  try {
    const grade = await new Promise((resolve, reject) => {
      db.get(`SELECT grade FROM grades WHERE student_id = ? AND course_id = ?`, [studentId, courseId], (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.grade : null);
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ grade }),
    };
  } catch (error) {
    console.error('Error fetching grade:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
