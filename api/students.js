const { Client } = require('pg');

module.exports = async (req, res) => {
  const { studentId } = req.query;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    if (studentId) {
      const result = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Student not found' });
      }
    } else {
      const result = await client.query('SELECT * FROM students');
      res.status(200).json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};
