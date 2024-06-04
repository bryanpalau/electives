const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjust the path to ensure it's relative to the function's location
const dbPath = path.resolve(__dirname, '../../schema.db');
const db = new sqlite3.Database(dbPath);

exports.handler = async (event, context) => {
  const { studentId, electiveType } = event.queryStringParameters;
  const electiveTable = electiveType;

  try {
    const courses = await new Promise((resolve, reject) => {
      db.all(`SELECT course_id, course_name, required_grade FROM ${electiveTable}`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const takenCourses = await new Promise((resolve, reject) => {
      db.all(`SELECT course_id FROM taken_courses WHERE student_id = ?`, [studentId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const takenCourseIds = takenCourses.map(tc => tc.course_id);

    const grades = await new Promise((resolve, reject) => {
      db.all(`SELECT course_id, grade FROM grades WHERE student_id = ?`, [studentId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const courseGrades = grades.reduce((acc, grade) => {
      acc[grade.course_id] = grade.grade;
      return acc;
    }, {});

    const courseCounts = await new Promise((resolve, reject) => {
      db.all(`SELECT course_id, COUNT(*) as count FROM selected_courses WHERE elective_type = ? GROUP BY course_id`, [electiveType], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const courseCountMap = courseCounts.reduce((acc, count) => {
      acc[count.course_id] = count.count;
      return acc;
    }, {});

    courses.forEach(course => {
      const studentGrade = courseGrades[course.course_id];
      const selectedCount = courseCountMap[course.course_id] || 0;
      if (
        takenCourseIds.includes(course.course_id) ||
        (course.required_grade && (!studentGrade || studentGrade < course.required_grade)) ||
        selectedCount >= 16
      ) {
        course.disabled = true;
      } else {
        course.disabled = false;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(courses),
    };
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
