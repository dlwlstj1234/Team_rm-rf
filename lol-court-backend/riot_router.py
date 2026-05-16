from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt
import riot
import database, models

router = APIRouter()
SECRET_KEY = "lolmunchul_secret"

class RiotRequest(BaseModel):
    summoner_name: str
    tag: str

@router.post("/riot/link")
async def riot_link(data: RiotRequest, token: str, db: Session = Depends(database.get_db)):
    # 로그인 확인
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]
    except:
        return {"success": False, "message": "로그인이 필요합니다."}

    # puuid 가져오기
    account, error = await riot.get_puuid(data.summoner_name, data.tag)
    if error:
        return {"success": False, "message": error}

    # 소환사 정보 가져오기
    summoner, error = await riot.get_summoner_by_puuid(account["puuid"])
    if error:
        return {"success": False, "message": error}

    # 티어 가져오기
    tier, error = await riot.get_tier(summoner["id"])
    if error:
        return {"success": False, "message": error}

    # 유저 테이블에 저장
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user.summoner_name = data.summoner_name
    user.summoner_id = summoner["id"]
    user.tier = tier
    user.is_verified = True
    db.commit()

    return {
        "success": True,
        "message": "연동 완료!",
        "summoner_name": data.summoner_name,
        "tag": data.tag,
        "tier": tier
    }