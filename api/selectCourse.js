const { Client } = require('pg');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studentId, courseId } = req.body;

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

    // Check if the student has already taken the course
    const checkTakenCourse = await client.query(
      'SELECT * FROM taken_courses WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    if (checkTakenCourse.rows.length > 0) {
      return res.status(400).json({ error: 'Course already taken' });
    }

    // Insert the selected course
    const result = await client.query(
      'INSERT INTO selected_courses (student_id, course_id, timestamp) VALUES ($1, $2, NOW()) RETURNING *',
      [studentId, courseId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error selecting course:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};
