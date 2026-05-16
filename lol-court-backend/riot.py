import httpx

RIOT_API_KEY = "RGAPI-c480b0c8-a8a4-4674-b216-06211b3c1da7"
HEADERS = {"X-Riot-Token": RIOT_API_KEY}

async def get_puuid(summoner_name: str, tag: str):
    url = f"https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{summoner_name}/{tag}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS)

        if res.status_code == 404:
            return None, "존재하지 않는 소환사명 또는 태그입니다."
        if res.status_code == 403:
            return None, "API 키가 만료됐습니다. 재발급 해주세요."
        if res.status_code == 429:
            return None, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        if res.status_code != 200:
            return None, "Riot 서버 오류입니다. 잠시 후 다시 시도해주세요."

        return res.json(), None

async def get_summoner_by_puuid(puuid: str):
    url = f"https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS)

        if res.status_code == 404:
            return None, "소환사 정보를 찾을 수 없습니다."
        if res.status_code == 403:
            return None, "API 키가 만료됐습니다. 재발급 해주세요."
        if res.status_code == 429:
            return None, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        if res.status_code != 200:
            return None, "Riot 서버 오류입니다. 잠시 후 다시 시도해주세요."

        return res.json(), None

async def get_tier(summoner_id: str):
    url = f"https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS)

        if res.status_code == 403:
            return None, "API 키가 만료됐습니다. 재발급 해주세요."
        if res.status_code == 429:
            return None, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        if res.status_code != 200:
            return None, "Riot 서버 오류입니다. 잠시 후 다시 시도해주세요."

        data = res.json()
        for entry in data:
            if entry["queueType"] == "RANKED_SOLO_5x5":
                return f"{entry['tier']} {entry['rank']}", None

        return "언랭", None
