from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    username      = Column(String, unique=True)   # 아이디
    password      = Column(String)                # 비밀번호 (해싱)
    summoner_name = Column(String, default="")    # 나중에 Riot 인증 시 입력
    summoner_id   = Column(String, default="")    # Riot API용
    tier          = Column(String, default="")    # 티어
    is_verified   = Column(Boolean, default=False) # Riot 인증 여부
    gold          = Column(Integer, default=0)    # 골드 시스템
    created_at    = Column(DateTime, default=datetime.utcnow)