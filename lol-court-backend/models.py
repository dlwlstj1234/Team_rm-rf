from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from database import Base

from datetime import datetime, timezone  # 수정: timezone 추가

# SQLAlchemy의 기본 클래스 생성 (모든 테이블 클래스가 이를 상속받음)


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, nullable=False, index=True) # 로그인 아이디
    password      = Column(String)                                         # 비밀번호 (해싱 권장)
    summoner_name = Column(String, default="")                             # 소환사명
    summoner_id   = Column(String, default="")                             # Riot API 고유 ID
    tier          = Column(String, default="Unranked")                    # 티어 (기본값 설정)
    is_verified   = Column(Boolean, default=False)                        # 라이엇 인증 여부
    gold          = Column(Integer, default=50)                           # 기본 자본금 50골드
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))             # 가입일시

class Case(Base):
    """
    사건 테이블: 배팅의 대상이 되는 '롤 판결' 영상 정보를 저장합니다.
    """
    __tablename__ = "cases"
    
    # 사건의 고유 번호 (어떤 사건에 배팅했는지 구분하는 기준)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # 재판의 제목 (예: "야스오 0데스 판결 부탁드립니다")
    title = Column(String)
    
    # 분석할 영상의 주소 (유튜브 링크 등 화면에 띄울 영상 경로)
    video_url = Column(String)
    start_time = Column(Integer, default=0)  # 시작 시간 (초)
    end_time = Column(Integer, default=0)    # 종료 시간 (초)
    
    # 대결 구도의 첫 번째 챔피언 이름 (왼쪽 팀)
    champion_a = Column(String)
    
    # 대결 구도의 두 번째 챔피언 이름 (오른쪽 팀)
    champion_b = Column(String)
    # [추가] AI 판결 관련 데이터 (유저 투표 전엔 숨겨짐)
    ai_score_a = Column(Integer, default=50)
    ai_score_b = Column(Integer, default=50)
    ai_winner = Column(String)  # AI가 선택한 승자 ("A" 또는 "B")
    ai_opinion = Column(Text)   # AI의 상세 판결문 (긴 문장이므로 Text 타입)
    
    # 현재 배팅을 받을 수 있는 상태인지 여부 (False가 되면 배팅 중단)
    is_active = Column(Boolean, default=True)
    is_lol_video = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    views = Column(Integer, default=0, index=True)

class Vote(Base):
    __tablename__ = "votes"
    
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id")) 
    case_id       = Column(Integer, ForeignKey("cases.id")) 
    selected_side = Column(String)    # 유저가 고른 쪽 ("A" 또는 "B")
    
    # 판결 후 업데이트용
    is_winner     = Column(Boolean, nullable=True)   # 맞혔는지 여부
    is_rewarded   = Column(Boolean, default=False)   # 포인트 지급 완료 여부
    
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Comment(Base):
    __tablename__ = "comments"

    id         = Column(Integer, primary_key=True, index=True)
    case_id    = Column(Integer, ForeignKey("cases.id")) # 어떤 사건의 댓글인가
    user_id    = Column(Integer, ForeignKey("users.id"))  # 누가 썼는가
    content    = Column(Text, nullable=False)             # 댓글 내용
    
    # [핵심] 댓글 작성 시점의 티어를 저장하거나, 조회 시 유저 테이블에서 가져올 수 있어.
    # 여기서는 유저 테이블과 '관계(Relationship)'를 맺어서 실시간 티어를 가져오도록 할게.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))