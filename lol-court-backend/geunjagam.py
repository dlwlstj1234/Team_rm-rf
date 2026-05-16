from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
import models

router = APIRouter()

@router.get("/ranking/geunjagam")
def get_geunjagam_ranking(db: Session = Depends(get_db)):
    results = db.query(
        models.User.id,
        models.User.username,
        models.User.tier,
        func.count(models.Vote.id).label("geunjagam_point")
    ).join(models.Case, models.Case.user_id == models.User.id)\
     .join(models.Vote, models.Vote.case_id == models.Case.id)\
     .group_by(models.User.id)\
     .order_by(desc(func.count(models.Vote.id)))\
     .all()

    ranking = []
    for idx, (user_id, username, tier, point) in enumerate(results, start=1):
        ranking.append({
            "rank": idx,
            "user_id": user_id,
            "username": username,
            "tier": tier,
            "geunjagam_point": point
        })

    return ranking
