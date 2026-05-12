import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# 1. DB 초기화 (테이블 생성)
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def create_seed_data():
    print("🚀 데이터 초기화 및 랭킹 테스트용 데이터 생성 시작...")
    
    # 기존 데이터 삭제
    db.query(models.Vote).delete()
    db.query(models.Case).delete()
    db.commit()

    # 10개의 각기 다른 성격의 사건 생성
    for i in range(1, 11):
        # 사건 생성
        new_case = models.Case(
            title=f"롤 판결 제 {i}호 사건",
            video_url=f"https://youtube.com/watch?v=lol_{i}",
            # 조회수도 랭킹을 위해 다양하게 부여
            views=random.randint(50, 2000)
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        # --- 랭킹 테스트를 위한 '사건 성격' 결정 ---
        if i <= 3:
            # 1~3번 사건: '박빙' (A 승률 45~55%)
            win_rate_a = random.uniform(0.45, 0.55)
            tag = "박빙 후보"
        elif i <= 6:
            # 4~6번 사건: 'A 압도' (A 승률 85~98%)
            win_rate_a = random.uniform(0.85, 0.98)
            tag = "A 압도 후보"
        else:
            # 7~10번 사건: 'B 압도' (A 승률 2~15%)
            win_rate_a = random.uniform(0.02, 0.15)
            tag = "B 압도 후보"

        # 투표수 생성 (최소 15개 ~ 최대 60개)
        vote_count = random.randint(15, 60)
        
        for _ in range(vote_count):
            # 위에서 정해진 '성격(확률)'에 따라 투표 생성
            choice = "A" if random.random() < win_rate_a else "B"
            new_vote = models.Vote(
                case_id=new_case.id,
                user_id=random.randint(1, 5000),
                selected_side=choice
            )
            db.add(new_vote)
        
        print(f"✅ 사건 {i} 생성 완료 | 조회수: {new_case.views} | 성격: {tag} | 투표수: {vote_count}")
    
    db.commit()
    print("\n✨ 모든 테스트 데이터가 성공적으로 세팅되었습니다!")

if __name__ == "__main__":
    create_seed_data()
    db.close()