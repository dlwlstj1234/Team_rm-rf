from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from jose import jwt
import bcrypt
import database, models

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
SECRET_KEY = "lolmunchul_secret"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 회원가입 — 아이디/비밀번호만
class RegisterRequest(BaseModel):
    username: str
    password: str

# 로그인
class LoginRequest(BaseModel):
    username: str
    password: str



# 회원가입
@app.post("/register")
def register(data: RegisterRequest, db: Session = Depends(database.get_db)):
    # 아이디 중복 확인
    existing = db.query(models.User).filter(
        models.User.username == data.username
    ).first()
    if existing:
        return {"error": "이미 존재하는 아이디입니다."}

    # 비밀번호 길이 확인
    if len(data.password) < 6:
        return {"error": "비밀번호는 6자 이상이어야 합니다."}

    # 비밀번호 해싱 후 저장
    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())
    user = models.User(
        username=data.username,
        password=hashed_pw.decode()
    )
    db.add(user)
    db.commit()
    return {"message": "회원가입 완료"}


# 로그인
@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        models.User.username == data.username
    ).first()
    if not user:
        return {"error": "존재하지 않는 아이디입니다."}

    if not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        return {"error": "비밀번호가 틀렸습니다."}

    token = jwt.encode(
        {"user_id": user.id, "username": user.username},
        SECRET_KEY,
        algorithm="HS256"
    )
    return {"token": token}


# 내 정보 조회
@app.get("/me")
def get_me(token: str, db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = db.query(models.User).filter(
            models.User.id == payload["user_id"]
        ).first()
        return {
            "username": user.username,
            "tier": user.tier,
            "is_verified": user.is_verified,  # Riot 인증 여부
            "gold": user.gold
        }
    except:
        return {"error": "유효하지 않은 토큰"}