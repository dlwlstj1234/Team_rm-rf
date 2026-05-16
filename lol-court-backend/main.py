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
from fastapi.middleware.cors import CORSMiddleware
from login_router import router as login_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LoL Court API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geunjagam_router)
app.include_router(riot_router)
app.include_router(login_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    password: str
    summoner_name: Optional[str] = ""
    summoner_id: Optional[str] = ""
    tier: Optional[str] = "Unranked"

class CaseCreate(BaseModel):
    user_id: int
    title: str
    video_url: str
    champion_a: str
    champion_b: str
    start_time: int
    end_time: int
    is_lol_video: bool
    ai_score_a: int
    ai_score_b: int
    ai_opinion: str

class VoteCreate(BaseModel):
    user_id: int
    case_id: int
    selected_side: str

class CommentCreate(BaseModel):
    user_id: int
    case_id: int
    content: str

class CommentResponse(BaseModel):
    id: int
    username: str
    tier: str
    content: str
    side: str
    created_at: datetime

    class Config:
        from_attributes = True

@app.get("/")
def read_root():
    return {"status": "success", "message": "롤 법정 백엔드 서버가 가동 중입니다!"}

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.post("/cases")
def create_case(
    case_data: CaseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if not case_data.is_lol_video:
        raise HTTPException(status_code=400, detail="롤 관련 영상이 아닙니다.")

    if case_data.start_time >= case_data.end_time:
        raise HTTPException(status_code=400, detail="종료 시간은 시작 시간보다 늦어야 합니다.")

    user = db.query(models.User).filter(models.User.id == case_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="존재하지 않는 유저입니다.")

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
    db.refresh(new_case)

    background_tasks.add_task(
        run_ai_and_update_db,
        new_case.id,
        case_data.video_url,
        case_data.start_time,
        case_data.end_time,
        case_data.champion_a,
        case_data.champion_b
    )

    return {
        "status": "success",
        "message": "사건 등록 완료! AI 판사님이 영상을 분석하기 시작했습니다.",
        "case_id": new_case.id
    }

@app.get("/cases")
def get_all_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).filter(models.Case.is_active == True).order_by(models.Case.id.desc()).all()
    return cases

@app.post("/votes")
def place_vote(vote_data: VoteCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == vote_data.user_id).first()
    case = db.query(models.Case).filter(models.Case.id == vote_data.case_id).first()

    if not user or not case:
        raise HTTPException(status_code=404, detail="유저 또는 사건을 찾을 수 없습니다.")

    side = vote_data.selected_side.upper()
    if side not in ['A', 'B']:
        raise HTTPException(status_code=400, detail="잘못된 투표 값입니다. 'A' 또는 'B'만 입력 가능합니다.")

    already_voted = db.query(models.Vote).filter(
        models.Vote.user_id == vote_data.user_id,
        models.Vote.case_id == vote_data.case_id
    ).first()

    if already_voted:
        raise HTTPException(status_code=400, detail="이미 이 사건에 투표하셨습니다.")

    is_correct = (side == case.ai_winner)
    reward_amount = 10 if is_correct else 0

    if is_correct:
        user.gold += reward_amount

    new_vote = models.Vote(
        user_id=vote_data.user_id,
        case_id=vote_data.case_id,
        selected_side=side,
        is_winner=is_correct,
        is_rewarded=is_correct
    )

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
            "ai_opinion": case.ai_opinion
        }
    }

@app.get("/cases/{case_id}")
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()

    if not case:
        raise HTTPException(status_code=404, detail="해당 사건을 찾을 수 없습니다.")

    case.views += 1
    db.commit()
    db.refresh(case)

    vote_a_count = db.query(models.Vote).filter(models.Vote.case_id == case_id, models.Vote.selected_side == "A").count()
    vote_b_count = db.query(models.Vote).filter(models.Vote.case_id == case_id, models.Vote.selected_side == "B").count()
    total_votes = vote_a_count + vote_b_count

    ratio_a = (vote_a_count / total_votes * 100) if total_votes > 0 else 50.0
    ratio_b = (vote_b_count / total_votes * 100) if total_votes > 0 else 50.0

    return {
        "id": case.id,
        "title": case.title,
        "video_url": case.video_url,
        "champion_a": case.champion_a,
        "champion_b": case.champion_b,
        "start_time": case.start_time,  # ✅
        "end_time": case.end_time,      # ✅
        "ai_score_a": case.ai_score_a,
        "ai_score_b": case.ai_score_b,
        "ai_opinion": case.ai_opinion,
        "views": case.views,
        "voting_stats": {
            "total_votes": total_votes,
            "side_a_count": vote_a_count,
            "side_b_count": vote_b_count,
            "side_a_ratio": round(ratio_a, 1),
            "side_b_ratio": round(ratio_b, 1),
            "side_a_name": case.champion_a,
            "side_b_name": case.champion_b
        }
    }

@app.post("/cases/{case_id}/comments")
def create_comment(case_id: int, comment_data: CommentCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == comment_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    user_vote = db.query(models.Vote).filter(
        models.Vote.case_id == case_id,
        models.Vote.user_id == comment_data.user_id
    ).first()

    if not user_vote:
        raise HTTPException(status_code=403, detail="투표를 완료한 유저만 토론에 참여할 수 있습니다.")

    new_comment = models.Comment(
        case_id=case_id,
        user_id=comment_data.user_id,
        content=comment_data.content,
        side=user_vote.selected_side
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return {"status": "success", "message": "댓글이 등록되었습니다."}

@app.get("/cases/{case_id}/comments", response_model=List[CommentResponse])
def get_comments(case_id: int, db: Session = Depends(get_db)):
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

@app.get("/cases/ranking/{sort_type}")
def get_case_ranking(sort_type: str, db: Session = Depends(get_db)):
    try:
        query = db.query(
            models.Case,
            func.count(models.Vote.id).label("total_votes"),
            func.sum(case((models.Vote.selected_side == 'A', 1), else_=0)).label("count_a"),
            func.sum(case((models.Vote.selected_side == 'B', 1), else_=0)).label("count_b")
        ).outerjoin(models.Vote).group_by(models.Case.id)

        if sort_type == "views":
            results = query.order_by(desc(models.Case.views)).all()
        elif sort_type in ["tight", "overwhelming"]:
            results = query.having(func.count(models.Vote.id) >= 10).all()
        else:
            raise HTTPException(status_code=400, detail="Invalid sort type")

        ranking_list = []
        for case_obj, total, a_val, b_val in results:
            t_val = int(total) if total else 0
            a_count = int(a_val) if a_val else 0

            if t_val > 0:
                a_ratio = round((a_count / t_val) * 100, 1)
                b_ratio = round(100.0 - a_ratio, 1)
            else:
                a_ratio, b_ratio = 0.0, 0.0

            ranking_list.append({
                "id": case_obj.id,
                "title": case_obj.title,
                "video_url": case_obj.video_url,
                "champion_a": case_obj.champion_a,
                "champion_b": case_obj.champion_b,
                "views": case_obj.views,
                "total_votes": t_val,
                "side_a_ratio": a_ratio,
                "side_b_ratio": b_ratio
            })

        if sort_type == "tight":
            ranking_list.sort(key=lambda x: abs(x['side_a_ratio'] - x['side_b_ratio']))
        elif sort_type == "overwhelming":
            ranking_list.sort(key=lambda x: abs(x['side_a_ratio'] - x['side_b_ratio']), reverse=True)

        return ranking_list

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 내부 에러: {str(e)}")

@app.get("/votes/my")
def get_my_vote(user_id: int, case_id: int, db: Session = Depends(get_db)):
    vote = db.query(models.Vote).filter(
        models.Vote.user_id == user_id,
        models.Vote.case_id == case_id
    ).first()
    if not vote:
        return {"selected_side": None}
    return {"selected_side": vote.selected_side}
