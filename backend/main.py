import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# Initialize FastAPI app
app = FastAPI()

# Allow frontend (like your Next.js app) to access backend APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup (SQLite)
DATABASE_URL = "sqlite:///./notes.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Table model
class NoteDB(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    description = Column(String, index=True)

# Create all database tables
Base.metadata.create_all(bind=engine)

# Pydantic model for request validation
class Note(BaseModel):
    subject: str
    description: str

# API endpoint to create a note
@app.post("/notes")
def create_note(note: Note):
    db = SessionLocal()
    new_note = NoteDB(subject=note.subject, description=note.description)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    db.close()
    return {"message": "Note saved successfully!", "id": new_note.id}

# API endpoint to get all notes
@app.get("/notes")
def get_notes():
    db = SessionLocal()
    notes = db.query(NoteDB).all()
    db.close()
    return notes

# Root route (optional)
@app.get("/")
def root():
    return {"message": "FastAPI backend is running successfully!"}
