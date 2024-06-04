import sqlite3

# Path to your schema.db file
db_path ='/Users/bryanhsu/electives/schema.db'

# Connect to the database
connection = sqlite3.connect(db_path)
cursor = connection.cursor()

# Check the tables in the database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

# Fetch and display the schema of each table
schema_info = {}
for table in tables:
    table_name = table[0]
    cursor.execute(f"PRAGMA table_info({table_name});")
    schema_info[table_name] = cursor.fetchall()

# Close the connection
connection.close()

# Print the schema information
for table_name, schema in schema_info.items():
    print(f"Table: {table_name}")
    for column in schema:
        print(column)
    print()

# Example of output formatting
# Table: students
# (0, 'student_id', 'INTEGER', 1, None, 1)
# (1, 'student_name', 'TEXT', 1, None, 0)
