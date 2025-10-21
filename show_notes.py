import sqlite3

# connect to your notes.db
conn = sqlite3.connect("notes.db")
cursor = conn.cursor()

# check tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", cursor.fetchall())

# fetch all notes
cursor.execute("SELECT * FROM notes;")
rows = cursor.fetchall()

print("\nStored Notes:")
for row in rows:
    print(row)

conn.close()
