📒 #Quicknote1

Quicknote1 is a browser extension with a FastAPI backend that lets you quickly save notes (title + description) into a local SQLite database.

⚡ Features

✍️ Save notes (title + description) via extension popup

💾 Automatically stores data into SQLite (notes.db)

⚡ FastAPI backend for handling note storage

🖥️ Simple REST API (POST request for new notes, GET for fetching notes)

🗃️ Lightweight database (notes.db) created automatically

🛠️ Setup Instructions
1️⃣ Clone the repository
git clone https://github.com/aerotrail-chandrikatalla/Quicknote1.git
cd Quicknote1

2️⃣ Setup Python environment

Create and activate a virtual environment:

# Windows (PowerShell)
python -m venv env
.\env\Scripts\activate

# Mac/Linux
python3 -m venv env
source env/bin/activate


Install dependencies:

pip install fastapi uvicorn


(SQLite is built into Python, no need to install separately.)

3️⃣ Run the backend server

Inside the project folder:

uvicorn backend.main:app --reload


Server runs at: http://127.0.0.1:8000

On first run, a notes.db file is created with a notes table

4️⃣ Test the API
Add a note
curl -X POST "http://127.0.0.1:8000/notes/" ^
-H "Content-Type: application/json" ^
-d "{\"title\":\"Test Note\", \"description\":\"This is a sample description.\"}"

Fetch all notes
curl http://127.0.0.1:8000/notes/

5️⃣ Check the database manually

Run this script inside backend/:

python show_notes.py


It will print all notes from notes.db.

🚫 Git Ignore Database

⚠️ Don’t commit notes.db to git. Add this to .gitignore:

*.db

🧑‍💻 Project Structure
Quicknote1/
│── backend/

│   ├── main.py          # FastAPI app

│   ├── show_notes.py    # Debug: view saved notes

│   └── notes.db         # SQLite database (auto-created, ignored in git)

│

│── manifest.json        # Chrome extension manifest

│── popup.html           # Extension popup

│── popup.js             # Handles note saving

│── README.md            # This file
