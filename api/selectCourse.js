const { Client } = require('pg');

module.exports = async (req, res) => {
  const { studentId, courseId } = req.body;

  // Ensure the request has the required parameters
  if (!studentId || !courseId) {
    return res.status(400).json({ error: 'Missing studentId or courseId' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Check if the student has already selected this course
    const checkQuery = 'SELECT * FROM selected_courses WHERE student_id = $1 AND course_id = $2';
    const checkResult = await client.query(checkQuery, [studentId, courseId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Course already selected' });
    }

    // Insert the selected course into the database
    const insertQuery = 'INSERT INTO selected_courses (student_id, course_id, timestamp) VALUES ($1, $2, NOW()) RETURNING *';
    const result = await client.query(insertQuery, [studentId, courseId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};
