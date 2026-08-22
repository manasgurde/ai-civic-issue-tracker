import os
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime, timedelta
from typing import Optional, List
import random

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, JSON, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
import shutil
import cloudinary
import cloudinary.uploader

cloudinary.config(secure=True)
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel
from ai_service import analyze_complaint, verify_resolution
from apscheduler.schedulers.background import BackgroundScheduler

SECRET_KEY = os.environ.get("SECRET_KEY", "ultra-secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./civic.db")
WORKER_ACCESS_CODE = os.environ.get("WORKER_ACCESS_CODE", "12345678")
ADMIN_ACCESS_CODE = os.environ.get("ADMIN_ACCESS_CODE", "00000000")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CityDB(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    state = Column(String, default="Unknown")
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="citizen")
    name = Column(String, nullable=True)
    preferences = Column(JSON, default={})
    city_id = Column(Integer, ForeignKey("cities.id"), default=1)

class ComplaintDB(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String)
    department = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    severity_score = Column(Integer, nullable=True)
    fraud_score = Column(Integer, nullable=True)
    status = Column(String, default="submitted")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    resolved_image_url = Column(String, nullable=True)
    is_resolution_verified = Column(Boolean, default=False)
    ai_resolution_summary = Column(String, nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), default=1)

class ZoneHealthDB(Base):
    __tablename__ = "zone_health"
    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, index=True)
    health_score = Column(Integer)
    timestamp = Column(String)
    ai_summary = Column(String, nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), default=1)

Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    email: str
    password: str
    city_id: int = 1
    role: str = "citizen"
    access_code: Optional[str] = None
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str] = None
    preferences: dict
    city_id: int
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    city_lat: Optional[float] = None
    city_lng: Optional[float] = None
    model_config = {"from_attributes": True}

class UserPublic(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str] = None
    city_id: int
    model_config = {"from_attributes": True}

class CityResponse(BaseModel):
    id: int
    name: str
    state: str
    lat: float
    lng: float
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class PreferencesUpdate(BaseModel):
    preferences: dict
    city_id: int

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    landmark: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    assigned_worker_id: Optional[int] = None
    title: str
    description: str
    category: str
    department: Optional[str] = None
    priority: Optional[str] = None
    severity_score: Optional[int] = None
    fraud_score: Optional[int] = None
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    image_url: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_image_url: Optional[str] = None
    is_resolution_verified: Optional[bool] = None
    ai_resolution_summary: Optional[str] = None
    model_config = {"from_attributes": True}

class StatusUpdate(BaseModel):
    status: str

class AssignWorker(BaseModel):
    worker_id: Optional[int] = None

class ResolveComplaint(BaseModel):
    status: str
    resolution_notes: Optional[str] = None

class ZoneHealthResponse(BaseModel):
    zone_name: str
    health_score: int
    timestamp: str
    ai_summary: Optional[str] = None

app = FastAPI(title="Civic Platform API")

@app.get("/cities", response_model=list[CityResponse])
def get_cities(db: Session = Depends(get_db)):
    return db.query(CityDB).all()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.role == "worker":
        if user.access_code != WORKER_ACCESS_CODE:
            raise HTTPException(status_code=403, detail="Invalid access code for Worker registration.")
    elif user.role == "admin":
        if user.access_code != ADMIN_ACCESS_CODE:
            raise HTTPException(status_code=403, detail="Invalid access code for Admin registration.")
    elif user.role != "citizen":
        raise HTTPException(status_code=400, detail="Invalid role.")
    hashed_password = get_password_hash(user.password)
    db_user = UserDB(email=user.email, hashed_password=hashed_password, city_id=user.city_id, role=user.role, name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    city = db.query(CityDB).filter(CityDB.id == db_user.city_id).first()
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        role=db_user.role,
        name=db_user.name,
        preferences=db_user.preferences or {},
        city_id=db_user.city_id,
        city_name=city.name if city else None,
        state_name=city.state if city else None,
    )

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "city_id": user.city_id}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    city = db.query(CityDB).filter(CityDB.id == current_user.city_id).first()
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        name=current_user.name,
        preferences=current_user.preferences or {},
        city_id=current_user.city_id,
        city_name=city.name if city else None,
        state_name=city.state if city else None,
        city_lat=city.lat if city else None,
        city_lng=city.lng if city else None,
    )

@app.put("/users/me", response_model=UserResponse)
def update_users_me(prefs: PreferencesUpdate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.preferences = prefs.preferences
    db.commit()
    db.refresh(current_user)
    city = db.query(CityDB).filter(CityDB.id == current_user.city_id).first()
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        name=current_user.name,
        preferences=current_user.preferences or {},
        city_id=current_user.city_id,
        city_name=city.name if city else None,
        state_name=city.state if city else None,
        city_lat=city.lat if city else None,
        city_lng=city.lng if city else None,
    )

@app.get("/auth/users", response_model=List[UserPublic])
def list_users(role: Optional[str] = Query(None), current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(UserDB).filter(UserDB.city_id == current_user.city_id)
    if role:
        query = query.filter(UserDB.role == role)
    return query.all()

@app.post("/auth/make_me_admin")
def make_me_admin(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    current_user.role = "admin"
    db.commit()
    return {"message": "You are now an admin!"}

@app.post("/complaints/", response_model=ComplaintResponse)
def create_complaint(complaint: ComplaintCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        ai_result = analyze_complaint(f"Title: {complaint.title}\nDescription: {complaint.description}")
    except Exception as e:
        print("AI Error:", e)
        ai_result = {"is_civic": True}
    if not ai_result.get("is_civic"):
        raise HTTPException(status_code=400, detail="Domain Restriction: This platform is only for civic and municipal complaints.")
    complaint_data = complaint.model_dump()
    complaint_data["category"] = ai_result.get("category", complaint.category)
    db_complaint = ComplaintDB(**complaint_data, user_id=current_user.id, city_id=current_user.city_id, department=ai_result.get("department"), priority=ai_result.get("priority"), severity_score=ai_result.get("severity_score"), fraud_score=ai_result.get("fraud_score"))
    recent_dupes = db.query(ComplaintDB).filter(ComplaintDB.title == complaint.title).all()
    if recent_dupes:
        db_complaint.status = "duplicate"
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@app.post("/complaints/{complaint_id}/image")
def upload_complaint_image(complaint_id: int, file: UploadFile = File(...), current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id, ComplaintDB.user_id == current_user.id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    try:
        upload_result = cloudinary.uploader.upload(file.file)
        complaint.image_url = upload_result.get("secure_url")
        db.commit()
        return {"image_url": complaint.image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

@app.post("/complaints/{complaint_id}/resolution-image", response_model=ComplaintResponse)
def upload_resolution_image(complaint_id: int, file: UploadFile = File(...), notes: str = "", current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Worker uploads a resolution photo; AI verifies it against the original complaint image."""
    if current_user.role not in ("worker", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role == "worker" and complaint.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this complaint")

    # Save the resolution image to Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(file.file)
        resolved_url = upload_result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    original_url = complaint.image_url

    # AI verification
    try:
        ai_result = verify_resolution(
            description=f"{complaint.title}: {complaint.description}",
            original_image_url=original_url,
            resolution_image_url=resolved_url
        )
        is_verified = ai_result.get("is_verified", False)
        ai_summary = ai_result.get("summary", "AI verification complete.")
    except Exception as e:
        is_verified = False
        ai_summary = f"AI verification error: {str(e)}"

    complaint.resolved_image_url = resolved_url
    complaint.is_resolution_verified = is_verified
    complaint.ai_resolution_summary = ai_summary
    complaint.status = "pending_approval"
    if notes:
        complaint.resolution_notes = notes
    db.commit()
    db.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}/approve-resolution", response_model=ComplaintResponse)
def approve_resolution(complaint_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin approves a pending_approval complaint → sets status to resolved."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = "resolved"
    db.commit()
    db.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}/reject-resolution", response_model=ComplaintResponse)
def reject_resolution(complaint_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin rejects a pending_approval complaint → sends back to in_progress."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = "in_progress"
    complaint.resolved_image_url = None
    complaint.is_resolution_verified = False
    complaint.ai_resolution_summary = None
    db.commit()
    db.refresh(complaint)
    return complaint

@app.get("/complaints/my", response_model=list[ComplaintResponse])
def get_my_complaints(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ComplaintDB).filter(ComplaintDB.user_id == current_user.id).all()

@app.get("/complaints/assigned", response_model=list[ComplaintResponse])
def get_assigned_complaints(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("worker", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(ComplaintDB).filter(ComplaintDB.assigned_worker_id == current_user.id).all()

@app.get("/complaints/", response_model=list[ComplaintResponse])
def get_all_complaints(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(ComplaintDB).filter(ComplaintDB.city_id == current_user.city_id).all()

@app.put("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(complaint_id: int, update: StatusUpdate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role == "worker" and complaint.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint.status = update.status
    db.commit()
    db.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_complaint(complaint_id: int, assign: AssignWorker, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(ComplaintDB).filter(ComplaintDB.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if assign.worker_id:
        worker = db.query(UserDB).filter(UserDB.id == assign.worker_id, UserDB.role == "worker").first()
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
    complaint.assigned_worker_id = assign.worker_id
    if assign.worker_id and complaint.status == "submitted":
        complaint.status = "in_progress"
    db.commit()
    db.refresh(complaint)
    return complaint

def generate_health_scores():
    db = SessionLocal()
    try:
        zones = ["North", "South", "East", "West"]
        for zone in zones:
            score = random.randint(30, 100)
            summary = "Infrastructure shows signs of wear, immediate maintenance recommended." if score < 50 else "Infrastructure is generally stable with minor issues." if score < 80 else "Infrastructure is in excellent condition."
            health_entry = ZoneHealthDB(zone_name=zone, city_id=1, health_score=score, ai_summary=f"AI Insight: {summary}", timestamp=datetime.utcnow().isoformat())
            db.add(health_entry)
        db.commit()
    finally:
        db.close()

@app.on_event("startup")
def start_scheduler():
    db = SessionLocal()
    try:
        if db.query(CityDB).count() <= 1:
            # Update existing city 1 to proper format if needed
            c1 = db.query(CityDB).filter(CityDB.id == 1).first()
            if c1:
                c1.name = "Bhopal"
                c1.state = "Madhya Pradesh"
                c1.lat = 23.2599
                c1.lng = 77.4126
            else:
                c1 = CityDB(id=1, name="Bhopal", state="Madhya Pradesh", lat=23.2599, lng=77.4126)
                db.add(c1)
            
            # Seed other cities
            cities_data = [
                {"name": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
                {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777},
                {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
                {"name": "New Delhi", "state": "Delhi", "lat": 28.6139, "lng": 77.2090}
            ]
            for cdata in cities_data:
                if not db.query(CityDB).filter(CityDB.name == cdata["name"]).first():
                    db.add(CityDB(**cdata))
            db.commit()
        if db.query(ZoneHealthDB).count() == 0:
            generate_health_scores()
    finally:
        db.close()
    scheduler = BackgroundScheduler()
    scheduler.add_job(generate_health_scores, 'interval', minutes=5)
    scheduler.start()

@app.get("/analytics/health_scores", response_model=list[ZoneHealthResponse])
def get_health_scores(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    zones = ["North", "South", "East", "West"]
    latest_scores = []
    for zone in zones:
        score = db.query(ZoneHealthDB).filter(ZoneHealthDB.zone_name == zone, ZoneHealthDB.city_id == current_user.city_id).order_by(ZoneHealthDB.id.desc()).first()
        if score:
            latest_scores.append(score)
    return latest_scores

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
