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

    account, error = await riot.get_puuid(data.summoner_name, data.tag)
    if error:
        return {"success": False, "message": error}

    summoner, error = await riot.get_summoner_by_puuid(account["puuid"])
    if error:
        return {"success": False, "message": error}

    # ✅ 키 이름 대응
    summoner_id = summoner.get("id") or summoner.get("encryptedSummonerId") or summoner.get("summonerId")
    if not summoner_id:
        print("summoner keys:", list(summoner.keys()))
        return {"success": False, "message": "소환사 ID를 찾을 수 없습니다."}

    tier, error = await riot.get_tier(summoner_id)
    if error:
        return {"success": False, "message": error}

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"success": False, "message": "유저를 찾을 수 없습니다."}

    user.summoner_name = data.summoner_name
    user.summoner_id = summoner_id
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