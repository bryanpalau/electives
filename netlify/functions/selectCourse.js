const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjust the path as necessary to match the deployment environment
const dbPath = path.resolve(__dirname, '..', '..', 'schema.db');
const db = new sqlite3.Database(dbPath);

exports.handler = async (event, context) => {
  const { studentId, courseId, electiveType } = JSON.parse(event.body);

  try {
    const existingSelection = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM selected_courses WHERE student_id = ? AND elective_type = ?`, [studentId, electiveType], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (existingSelection) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Student has already selected a course from this elective set' }),
      };
    }

    const takenCourse = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM taken_courses WHERE student_id = ? AND course_id = ?`, [studentId, courseId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (takenCourse) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Course already taken' }),
      };
    }

    const electiveTable = electiveType; // Use the electiveType directly as the table name

    const course = await new Promise((resolve, reject) => {
      db.get(`SELECT required_grade FROM ${electiveTable} WHERE course_id = ?`, [courseId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    const requiredGrade = course.required_grade;

    if (requiredGrade !== null) {
      const studentGrade = await new Promise((resolve, reject) => {
        db.get(`SELECT grade FROM grades WHERE student_id = ? AND course_id = ?`, [studentId, courseId], (err, row) => {
          if (err) return reject(err);
          resolve(row ? row.grade : null);
        });
      });

      if (studentGrade === null || studentGrade < requiredGrade) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `You have not met the grade requirement of ${requiredGrade}. Your grade is ${studentGrade !== null ? studentGrade : 'N/A'}.` }),
        };
      }
    }

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO selected_courses (student_id, course_id, course_name, elective_type, timestamp) VALUES (?, ?, (SELECT course_name FROM ${electiveTable} WHERE course_id = ?), ?, ?)`,
        [studentId, courseId, courseId, electiveType, timestamp],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' }),
    };
  } catch (error) {
    console.error('Error selecting course:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
