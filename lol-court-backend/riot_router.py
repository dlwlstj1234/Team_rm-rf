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
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id") or payload.get("id")
        if not user_id:
            return {"success": False, "message": "로그인이 필요합니다."}
    except:
        return {"success": False, "message": "로그인이 필요합니다."}

    # puuid 가져오기
    account, error = await riot.get_puuid(data.summoner_name, data.tag)
    if error:
        return {"success": False, "message": error}

    # ✅ get_summoner_by_puuid는 summonerLevel 등 기본 정보용으로만 사용
    summoner, error = await riot.get_summoner_by_puuid(account["puuid"])
    if error:
        return {"success": False, "message": error}

    # ✅ 티어는 puuid로 직접 조회
    tier, error = await riot.get_tier(account["puuid"])
    if error:
        return {"success": False, "message": error}

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"success": False, "message": "유저를 찾을 수 없습니다."}

    user.summoner_name = data.summoner_name
    user.summoner_id = account["puuid"]  # ✅ puuid를 summoner_id로 저장
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
