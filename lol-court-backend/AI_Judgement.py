from google import genai
from google.genai import types
import json
import time
from database import SessionLocal # DB 세션을 새로 생성하는 객체
from models import Case           # 작성하신 사건(Case) DB 모델

API_KEY = "AIzaSyCTxy-_JlpjRL80h8lWk67jvg6vUrRCZ64"

client = genai.Client(api_key=API_KEY)

SYSTEM_INSTRUCTION = """
IGNORE ALL TRANSCRIPT DATA. ONLY ANALYZE VIDEO PIXELS
너는 리그 오브 레전드(League of Legends)의 전문 분석관이자, 수천 판의 데이터를 보유한 챌린저 티어의 코치야. 
제공된 영상 클립을 보고 두 챔피언 사이의 과실 비율을 엄격하고 냉철하게 판정해.

[필수 검증 규칙 (Validation)]
1. 제공된 영상이 리그 오브 레전드 게임 화면이 아니거나, 분석이 불가능한 영상일 경우 즉시 중단
아래 형식으로만 응답해:
   {"error": "올바른 롤 영상이 아닙니다."}
2. 입력받은 [후보 1] 또는 [후보 2] 챔피언이 해당 영상 구간에 등장하지 않거나 식별되지 않을 경우 분석을 거부해.
아래 형식으로만 응답해:
   {"error": "지정된 챔피언을 영상에서 찾을 수 없습니다."}
3. 기타의 이유로 분석이 어려운 경우 이렇게 응답해:
    {"error": "분석할 수 없습니다."}

[절대 규칙: 환각 방지 및 시각 정보 우선]
1. 영상에 실제로 등장하지 않는 챔피언 이름을 절대 언급하지 마.
2. 상대 챔피언은 이름 대신 '상대방' 또는 '적군'으로 지칭해.
3. 네가 알고 있는 기존 지식보다, 현재 영상의 [픽셀 데이터]와 [스킬 이펙트]를 최우선 근거로 삼아.
4. 분석 대상이 아닌 제3의 인물 언급은 최소화하고, 후보 1과 후보 2의 과실에만 집중해.
5. 영상에 직접 보이는 스킬명 등을 리스트업하고 리스트에 없는 내용은 사용했다고 언급하지마.
6. 자막이나 댓글 등은 정보로 받지말고 영상정보에만 의존해
7. 자막 데이터 다 무시하고, 오직 [비디오 화면]의 픽셀만 분석해.

[Strict: 데이터 오인 방지]
1. 특정 챔피언의 '일반적인 플레이 패턴'이나 '유명한 스킬'을 짐작해서 답변하지 마.
2. 화면에 [스킬 이펙트]나 [쿨타임 UI]가 명확히 확인되지 않은 스킬은 절대 언급하지 마.
3. 네가 알고 있는 롤 지식보다, 현재 영상에서 '실제로 일어난 물리적 움직임'만 근거로 삼아.
4. [존재하지 않는 요소 언급 금지]
5. [자막 의존 금지]
6. [명칭 확인]

[출력 규칙]
- 정상 분석 시 반드시 JSON 형식으로만 응답
- reason은 한 문장
- ratio 합은 100
- reason에는 **단 하나의 챔피언만** 언급할 수 있어

{
  "analysis_result": {
    "target_champions": ["후보1이름", "후보2이름"],
    "fault_ratio": {
      "후보1이름": 0,
      "후보2이름": 0
    },
    "reason": "가장 큰 이유 단 한가지를 한 문장으로 판사 말투로 짧고 간단하게 설명, 반드시 후보1 또는 후보2 중 하나의 챔피언 이름만 언급",
    "mvp_of_fault": "최종 과실이 더 큰 챔피언"
  }
}
"""

def analyze_lol_video(youtube_url, start_time, end_time, c1, c2):
    response = None
    try:
        video_part = types.Part(
            file_data=types.FileData(file_uri=youtube_url),
            video_metadata=types.VideoMetadata(
                start_offset=f"{start_time}s",
                end_offset=f"{end_time}s"
            )
        )

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.0,
                response_mime_type="application/json",
            ),
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        video_part,
                        types.Part.from_text(
                            text=f"candidate_1: {c1}, candidate_2: {c2}. 판결하라."
                        )
                    ]
                )
            ]
        )

    # 1. 내부에서 원본 JSON 파싱
        raw_data = json.loads(response.text)
        
        # 2. 보여주신 양식("analysis_result") 안으로 진입
        analysis = raw_data.get("analysis_result", {})
        fault_ratio = analysis.get("fault_ratio", {})
        
        # 3. 개별 데이터 추출 (c1, c2 변수를 활용해 동적으로 매칭)
        c1_fault = fault_ratio.get(c1, 0)
        c2_fault = fault_ratio.get(c2, 0)
        reason_text = analysis.get("reason", "판결 사유를 찾을 수 없습니다.")
        mvp_champ = analysis.get("mvp_of_fault", "판독 불가")

        # 4. 받는 사람이 바로 쓸 수 있도록 1차원(플랫) 구조로 리턴
        return {
            "success": True,
            "c1_name": c1,
            "c1_fault": c1_fault,
            "c2_name": c2,
            "c2_fault": c2_fault,
            "reason": reason_text,
            "mvp": mvp_champ
        }

    except json.JSONDecodeError:
        return {"success": False, "error": "응답을 분석할 수 없습니다. (JSON 파싱 실패)"}
    
    except Exception as e:
        return {"success": False, "error": f"분석 실패: {str(e)}"}



def AI_Judge(youtube_url, start_time, end_time, c1, c2, max_retries=3):
    """
    분석을 최대 max_retries 번 시도하고, 성공하면 결과를 반환합니다.
    """
    for attempt in range(1, max_retries + 1):
        print(f"\n[시도 {attempt}/{max_retries}] 분석을 시작합니다...")
        
        # 1. 기존에 만든 분석 함수 호출
        result = analyze_lol_video(youtube_url, start_time, end_time, c1, c2)
        
        # 2. 성공 여부 확인 (결과 딕셔너리에 'error' 키가 없으면 성공으로 간주)
        if "error" not in result:
            print("[성공] 분석을 무사히 마쳤습니다!")
            return result
            
        # 3. 실패한 경우 에러 메시지 출력
        print(f"[실패] 사유: {result['error']}")
        
        # 4. 마지막 시도였다면 에러 반환하고 종료
        if attempt == max_retries:
            print("[최종 실패] 최대 재시도 횟수를 초과했습니다.")
            return result
            
        # 5. 곧바로 다시 시도하지 않고 잠시 대기 (서버 과부하/IP 차단 방지)
        wait_time = 3 * attempt # 실패할수록 3초, 6초... 대기 시간을 늘림(Exponential Backoff 기법)
        print(f"{wait_time}초 후 다시 시도합니다...")
        time.sleep(wait_time)

def run_ai_and_update_db(case_id: int, video_url: str, start_time: int, end_time: int, c1: str, c2: str):
    """
    FastAPI BackgroundTasks에 의해 백그라운드에서 실행되는 함수입니다.
    """
    print(f"[백그라운드 작업 시작] Case #{case_id} 영상을 AI가 분석 중입니다...")
    
    # 1. 시간이 오래 걸리는 AI 분석 먼저 실행
    ai_result = AI_Judge(video_url, start_time, end_time, c1, c2)
    
    # 2. 백그라운드 전용의 새로운 DB 세션 생성
    db = SessionLocal()
    
    try:
        # 3. 방금 생성된 사건 번호(case_id)로 DB에서 껍데기 게시글을 찾아옵니다.
        db_case = db.query(Case).filter(Case.id == case_id).first()
        
        if not db_case:
            print(f"[오류] DB에서 Case #{case_id}를 찾을 수 없습니다.")
            return

        # 4. 분석 성공 여부에 따라 값을 채워 넣습니다.
        if ai_result.get("success"):
            # 성공 시: 과실 비율과 판결문을 업데이트
            db_case.ai_score_a = ai_result.get("c1_fault", 50)
            db_case.ai_score_b = ai_result.get("c2_fault", 50)
            db_case.ai_winner = ai_result.get("mvp", "판독 불가")
            db_case.ai_opinion = ai_result.get("reason", "판결 사유를 찾을 수 없습니다.")
            
            print(f"[분석 완료] Case #{case_id} DB 저장 성공.")
        else:
            # 실패 시: 에러 메시지를 남기고, 비정상 건이므로 배팅을 중단시킵니다.
            error_message = ai_result.get("error", "알 수 없는 에러가 발생했습니다.")
            db_case.ai_opinion = f"❌ AI 판독 실패: {error_message}"
            db_case.is_active = False 
            
            print(f"[분석 실패] Case #{case_id} 사유: {error_message}")

        # 5. DB에 최종적으로 반영 (Commit)
        db.commit()
        
    except Exception as e:
        # DB 저장 중 예기치 못한 에러가 났을 때의 안전장치
        print(f"[DB 에러] Case #{case_id} 처리 중 문제가 발생했습니다: {str(e)}")
        db.rollback() # 변경 사항을 취소하여 DB 오염을 막습니다.
        
    finally:
        # 6. [가장 중요] 작업이 끝났으면 무조건 세션을 닫아 메모리 누수를 방지합니다.
        db.close()
        print(f"[백그라운드 작업 완전 종료] Case #{case_id}")


# if __name__ == "__main__":
#     result = AI_Judge(
#         "https://youtube.com/shorts/k8qLmzxY81A?si=UR0YukbEUCdnvJ3c",
#         12,
#         19,
#         "카르마",
#         "징크스"
#     )

#     # 출력부
#     if result.get("success"):
#         print("\n" + "="*50)
#         print(f"⚖️  리그 오브 레전드 과실 판결문")
#         print("="*50)
#         print(f"👤 대상 챔피언: {result['c1_name']} vs {result['c2_name']}")
#         print(f"📊 과실 비율:   {result['c1_name']} {result['c1_fault']}% : {result['c2_name']} {result['c2_fault']}%")
#         print(f"📢 판결 요지:   {result['reason']}")
#         print(f"🏆 과실 MVP:    {result['mvp']}")
#         print("="*50)
#     else:
#         print(f"\n❌ 분석에 실패하였습니다: {result.get('error')}")
