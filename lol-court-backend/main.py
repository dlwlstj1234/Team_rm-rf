from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func, desc, asc, case
from AI_Judgement import run_ai_and_update_db
from geunjagam import router as geunjagam_router
from riot_router import router as riot_router


# 서버 시작 시 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LoL Court API")

# 조원이 만든 기능을 서버에 등록하는 부분
app.include_router(geunjagam_router)
app.include_router(riot_router)

# --- [DB 연결 설정] ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- [데이터 규격 정의 (Pydantic Models)] ---

class UserCreate(BaseModel):
    username: str
    password: str
    summoner_name: Optional[str] = ""
    summoner_id: Optional[str] = ""
    tier: Optional[str] = "Unranked"

class CaseCreate(BaseModel):
    user_id: int        # 제보자 ID
    title: str
    video_url: str
    champion_a: str
    champion_b: str
    start_time: int
    end_time: int
    is_lol_video: bool
    ai_score_a: int      # [추가] A 과실 (0~100)
    ai_score_b: int      # [추가] B 과실 (0~100)
    ai_opinion: str     # AI의 판결 근거

# [추가] 투표 생성을 위한 규격 (배팅 금액 amount 제외)
class VoteCreate(BaseModel):
    user_id: int
    case_id: int
    selected_side: str  # "A" 또는 "B"

class CommentCreate(BaseModel):
    user_id: int
    case_id: int
    content: str

class CommentResponse(BaseModel):
    id: int
    username: str
    tier: str       # 유저의 티어를 함께 내려줌
    content: str
    side: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- [API 기능 구현 (Endpoints)] ---

@app.get("/")
def read_root():
    return {"status": "success", "message": "롤 법정 백엔드 서버가 가동 중입니다!"}

# 1. 유저 전체 조회
@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

# 2. 회원가입
'''
@app.post("/users")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 username(ID)입니다.")

    new_user = models.User(
        username=user_data.username,
        password=user_data.password,
        summoner_name=user_data.summoner_name,
        summoner_id=user_data.summoner_id,
        tier=user_data.tier,
        is_verified=False,
        gold=50
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "회원가입 성공!", "user": new_user}
'''

# 3. 사건 등록
@app.post("/cases")
def create_case(
    case_data: CaseCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # 1. 철저한 입력값 검증 (작성하신 훌륭한 로직 유지)
    if not case_data.is_lol_video:
        raise HTTPException(status_code=400, detail="롤 관련 영상이 아닙니다.")
    
    if case_data.start_time >= case_data.end_time:
        raise HTTPException(status_code=400, detail="종료 시간은 시작 시간보다 늦어야 합니다.")
    
    user = db.query(models.User).filter(models.User.id == case_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="존재하지 않는 유저입니다.")

    # 2. AI 판독 결과 없이 사건(Case) 기본 정보만 DB에 우선 생성
    # 참고: ai_score, ai_winner 등의 컬럼은 models.py에 설정된 default값(예: 50, None)으로 들어갑니다.
    new_case = models.Case(
        user_id=case_data.user_id,
        title=case_data.title,
        video_url=case_data.video_url,
        start_time=case_data.start_time,
        end_time=case_data.end_time,
        champion_a=case_data.champion_a,
        champion_b=case_data.champion_b,
        is_lol_video=case_data.is_lol_video,
        is_active=True
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case) # DB에서 할당된 new_case.id를 가져옴

    # 3. AI 판독 백그라운드 작업 지시
    background_tasks.add_task(
        run_ai_and_update_db, # AI를 돌리고 DB를 업데이트하는 별도 함수
        new_case.id,
        case_data.video_url,
        case_data.start_time,
        case_data.end_time,
        case_data.champion_a,
        case_data.champion_b
    )
    
    # 4. 클라이언트에게 즉시 응답 (대기 없음)
    return {
        "status": "success", 
        "message": "사건 등록 완료! AI 판사님이 영상을 분석하기 시작했습니다.", 
        "case_id": new_case.id
    }
# 4. 사건 전체 조회
@app.get("/cases")
def get_all_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).filter(models.Case.is_active == True).order_by(models.Case.id.desc()).all()
    return cases

# 5. [수정] 투표하기 API (즉석 판결 및 보상 추가)
@app.post("/votes")
def place_vote(vote_data: VoteCreate, db: Session = Depends(get_db)):
    # 1. 유저 및 사건 존재 확인
    user = db.query(models.User).filter(models.User.id == vote_data.user_id).first()
    case = db.query(models.Case).filter(models.Case.id == vote_data.case_id).first()
    
    if not user or not case:
        raise HTTPException(status_code=404, detail="유저 또는 사건을 찾을 수 없습니다.")
    
    # 2. 대소문자 통일 및 유효성 검사
    side = vote_data.selected_side.upper()
    if side not in ['A', 'B']:
        raise HTTPException(status_code=400, detail="잘못된 투표 값입니다. 'A' 또는 'B'만 입력 가능합니다.")

    # 3. 중복 투표 체크
    already_voted = db.query(models.Vote).filter(
        models.Vote.user_id == vote_data.user_id,
        models.Vote.case_id == vote_data.case_id
    ).first()
    
    if already_voted:
        raise HTTPException(status_code=400, detail="이미 이 사건에 투표하셨습니다.")

    # --- [핵심: 즉석 판결 및 보상 로직] ---
    # AI 정답과 비교
    is_correct = (side == case.ai_winner)
    reward_amount = 10 if is_correct else 0
    
    if is_correct:
        user.gold += reward_amount  # 맞히면 10골드 지급

    # 4. 투표 기록 저장 (판결 결과 포함)
    new_vote = models.Vote(
        user_id=vote_data.user_id,
        case_id=vote_data.case_id,
        selected_side=side,
        is_winner=is_correct,
        is_rewarded=is_correct  # 맞혔다면 보상 지급 완료 처리
    )
    # ---------------------------------------

    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    return {
        "status": "success", 
        "message": "투표 완료!",
        "result": {
            "is_correct": is_correct,
            "reward": reward_amount,
            "ai_winner": case.ai_winner,
            "ai_opinion": case.ai_opinion  # 투표 직후 AI 소견 공개!
        }
    }

# 6. 사건 상세 조회 (실시간 투표 통계 반영)
@app.get("/cases/{case_id}")
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="해당 사건을 찾을 수 없습니다.")
    
    #조회수 반영
    case.views += 1
    db.commit()      # DB에 반영
    db.refresh(case) # 최신 데이터로 동기화

    # 실제 투표수 계산
    vote_a_count = db.query(models.Vote).filter(models.Vote.case_id == case_id, models.Vote.selected_side == "A").count()
    vote_b_count = db.query(models.Vote).filter(models.Vote.case_id == case_id, models.Vote.selected_side == "B").count()
    total_votes = vote_a_count + vote_b_count
    
    # 비율 계산 (투표가 없을 땐 50:50)
    ratio_a = (vote_a_count / total_votes * 100) if total_votes > 0 else 50.0
    ratio_b = (vote_b_count / total_votes * 100) if total_votes > 0 else 50.0

    return {
<<<<<<< Updated upstream
        "status": "success",
        "case": case,
=======
        "id": case.id,
        "title": case.title,
        "video_url": case.video_url,
        "champion_a": case.champion_a,
        "champion_b": case.champion_b,
        "start_time": case.start_time,  # ✅ 추가
        "end_time": case.end_time,  # ✅ 추가
        "ai_score_a": case.ai_score_a,
        "ai_score_b": case.ai_score_b,
        "ai_opinion": case.ai_opinion,
        "views": case.views,
>>>>>>> Stashed changes
        "voting_stats": {
            "total_votes": total_votes,
            "side_a_count": vote_a_count,        # A팀 누적 투표수 [추가]
            "side_b_count": vote_b_count,        # B팀 누적 투표수 [추가]
            "side_a_ratio": round(ratio_a, 1),   # A팀 비율
            "side_b_ratio": round(ratio_b, 1),   # B팀 비율
            "side_a_name": case.champion_a,
            "side_b_name": case.champion_b
        }
    }

# 7. 댓글 작성 API
@app.post("/cases/{case_id}/comments")
def create_comment(case_id: int, comment_data: CommentCreate, db: Session = Depends(get_db)):
    # 유저 존재 확인
    user = db.query(models.User).filter(models.User.id == comment_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    # 2.  유저가 이 사건에 어디에 투표했는지 조회
    user_vote = db.query(models.Vote).filter(
        models.Vote.case_id == case_id,
        models.Vote.user_id == comment_data.user_id
    ).first()

    if not user_vote:
        raise HTTPException(status_code=403, detail="투표를 완료한 유저만 토론에 참여할 수 있습니다.")

    # 3. 투표한 진영(side) 정보를 자동으로 할당해서 저장
    new_comment = models.Comment(
        case_id=case_id,
        user_id=comment_data.user_id,
        content=comment_data.content,
        side=user_vote.selected_side  # 유저가 투표한 "A" 또는 "B"가 자동으로 들어감!
    )
   
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return {"status": "success", "message": "댓글이 등록되었습니다."}

# 8. 댓글 목록 조회 API (티어 정보 포함)
@app.get("/cases/{case_id}/comments", response_model=List[CommentResponse])
def get_comments(case_id: int, db: Session = Depends(get_db)):
    # 댓글을 가져오면서 작성자의 정보(이름, 티어)를 Join해서 가져옴
    comments = db.query(
        models.Comment.id,
        models.Comment.content,
        models.Comment.side,
        models.Comment.created_at,
        models.User.username,
        models.User.tier
    ).join(models.User, models.Comment.user_id == models.User.id)\
     .filter(models.Comment.case_id == case_id)\
     .order_by(models.Comment.created_at.asc()).all()
    
    return comments

# 랭킹 API 부분
@app.get("/cases/ranking/{sort_type}")
def get_case_ranking(sort_type: str, db: Session = Depends(get_db)):
    try:
        # 1. 기본 쿼리 (sql_case 대신 'case' 함수 사용 - 형의 임포트 기준)
        # 형의 임포트가 'from sqlalchemy import case' 이므로 그대로 'case' 사용
        query = db.query(
            models.Case,
            func.count(models.Vote.id).label("total_votes"),
            func.sum(case((models.Vote.selected_side == 'A', 1), else_=0)).label("count_a"),
            func.sum(case((models.Vote.selected_side == 'B', 1), else_=0)).label("count_b")
        ).outerjoin(models.Vote).group_by(models.Case.id)

        # 2. 정렬 조건에 따른 데이터 가져오기
        if sort_type == "views":
            # 조회수는 모든 데이터 대상
            results = query.order_by(desc(models.Case.views)).all()
        elif sort_type in ["tight", "overwhelming"]:
            # 박빙/압도는 데이터가 좀 쌓인 것만 (최소 10개)
            results = query.having(func.count(models.Vote.id) >= 10).all()
        else:
            raise HTTPException(status_code=400, detail="Invalid sort type")

        ranking_list = []
        for case_obj, total, a_val, b_val in results:
            t_val = int(total) if total else 0
            a_count = int(a_val) if a_val else 0
            
            if t_val > 0:
                # 상세페이지와 비율 로직 통일
                a_ratio = round((a_count / t_val) * 100, 1)
                b_ratio = round(100.0 - a_ratio, 1)
            else:
                a_ratio, b_ratio = 0.0, 0.0

            ranking_list.append({
                "id": case_obj.id,
                "title": case_obj.title,
                "views": case_obj.views,
                "total_votes": t_val,
                "side_a_ratio": a_ratio,
                "side_b_ratio": b_ratio
            })

        # 3. 파이썬 레벨에서 최종 정렬 (비율 기반)
        if sort_type == "tight":
            # 50:50에 가까운 순 (차이의 절대값이 작은 순)
            ranking_list.sort(key=lambda x: abs(x['side_a_ratio'] - x['side_b_ratio']))
        elif sort_type == "overwhelming":
            # 한쪽으로 쏠린 순 (차이의 절대값이 큰 순)
            ranking_list.sort(key=lambda x: abs(x['side_a_ratio'] - x['side_b_ratio']), reverse=True)

        return ranking_list

    except Exception as e:
        # 에러 발생 시 터미널 로그에 구체적인 이유 출력
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 내부 에러: {str(e)}")
