from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import google.generativeai as genai 
import csv
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ==========================================
# [설정] API 키 (공백 제거 안전장치 포함)
MY_API_KEY = "  ".strip()
# ==========================================

genai.configure(api_key=MY_API_KEY)
try:
    model_ai = genai.GenerativeModel('gemini-flash-latest')
except:
    model_ai = genai.GenerativeModel('gemini-pro')

# ---------------------------------------------------------
# [데이터베이스] 1. 잠재적 위험 (Hidden Risk Map)
# 상위 과목은 잘했지만 기초가 부실할 경우, 먼 미래에 문제가 될 연결고리
# ---------------------------------------------------------
HIDDEN_RISK_MAP = {
    "통계학1": {"future": "머신러닝/딥러닝", "msg": "기초 확률론이 약하면 AI 모델의 수식적 배경을 이해하기 어렵습니다."},
    "수학1": {"future": "공학수학", "msg": "미적분 기초가 부실하면 공학수학의 미분방정식을 풀 수 없습니다."},
    "파이썬데이터분석": {"future": "빅데이터플랫폼", "msg": "기초 문법과 메모리 구조를 모르면 대용량 처리가 불가합니다."},
    "선형대수학": {"future": "컴퓨터비전", "msg": "행렬 연산의 기하학적 의미를 모르면 이미지 변환 원리를 이해할 수 없습니다."}
    # ※ 나중에 여기에 과목을 더 추가하면 됩니다.
}

# ---------------------------------------------------------
# [데이터베이스] 2. 직속 연계 과목 (Direct Relations)
# 이 과목을 망치면 당장 다음 단계 수업이 힘든 관계
# ---------------------------------------------------------
SUBJECT_RELATIONS = {
    # 1학년 -> 2학년
    "통계학1": "통계학2",
    "데이터사이언스입문": "파이썬데이터분석",
    "수학1": "선형대수학",
    "수학2": "선형대수학과응용",
    # 2학년 -> 3학년
    "파이썬데이터분석": "공공데이터분석",
    "선형대수학": "머신러닝1",
    "자료구조": "데이터베이스",
    "딥러닝1": "딥러닝응용1",
    "R언어": "데이터시각화",
    # 3학년 -> 4학년
    "머신러닝1": "머신러닝2",
    "데이터베이스": "빅데이터플랫폼"
}

# ---------------------------------------------------------
# [데이터베이스] 3. 학습 자료 (Resources)
# ---------------------------------------------------------
SUBJECT_RESOURCES = {
    "DEFAULT": {"url": "https://www.youtube.com/", "desc": "기초 개념을 복습하여 다음 학기를 대비하세요."},
    "통계학1": {"url": "http://www.kmooc.kr/", "desc": "[기초 복습] 확률분포와 검정 통계량 개념 재정립 필요"},
    "통계학2": {"url": "http://www.kmooc.kr/", "desc": "[2학년 필수] 통계적 추론 심화 학습"},
    "선형대수학": {"url": "https://www.inflearn.com/", "desc": "[필수] 행렬과 벡터 공간의 개념은 AI의 핵심입니다."},
    "머신러닝1": {"url": "https://www.coursera.org/", "desc": "[전공 심화] 수학적 베이스가 없으면 모델 튜닝이 불가능합니다."},
    "파이썬데이터분석": {"url": "https://wikidocs.net/", "desc": "[실무 기초] Pandas 활용 능력 키우기"}
}

# --- 모델 로드 ---
try:
    model_1 = joblib.load('model_1_to_2.pkl')
    features_1 = joblib.load('features_1.pkl')
    model_2 = joblib.load('model_2_to_3.pkl')
    features_2 = joblib.load('features_2.pkl')
    model_3 = joblib.load('model_3_to_4.pkl')
    features_3 = joblib.load('features_3.pkl')
except:
    model_1, features_1, model_2, features_2, model_3, features_3 = None, None, None, None, None, None

#로그 저장
def save_log(student_id, year, prediction, weak_subjects, input_scores):
    filename = 'student_log.csv'
    current_time = datetime.now()
    
    # 점수 딕셔너리를 보기 좋은 문자열로 변환 (예: "수학1:4.5 / 통계학1:3.0")
    # sort_keys=True로 해서 순서가 뒤죽박죽되지 않게 함 (비교를 위해 중요)
    scores_str = " / ".join([f"{k}:{v}" for k, v in sorted(input_scores.items())])
    weak_str = ", ".join(weak_subjects)
    
    # --- [중복 체크 로직] ---
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                rows = list(reader)
                
                # 헤더 제외하고 데이터가 있다면
                if len(rows) > 1:
                    # 해당 학번의 기록만 골라내기 (최신순으로 뒤집어서 확인)
                    student_rows = [r for r in rows[1:] if r[1] == student_id]
                    
                    if student_rows:
                        last_row = student_rows[-1] # 가장 마지막(최신) 기록
                        last_time_str = last_row[0] # 날짜
                        last_scores_str = last_row[5] # 점수 기록 (6번째 칸에 저장할 예정)
                        
                        # 1. 시간 차이 계산
                        last_time = datetime.strptime(last_time_str, "%Y-%m-%d %H:%M:%S")
                        time_diff = current_time - last_time
                        
                        # 2. 로직: 점수가 똑같은데, 1시간(3600초)도 안 지났으면 저장 안 함!
                        if last_scores_str == scores_str and time_diff < timedelta(hours=1):
                            print(f"🚫 중복 저장 방지: {student_id} (변동사항 없음)")
                            return # 함수 종료 (저장 안 함)
        except Exception as e:
            print(f"⚠️ 중복 체크 중 오류 (무시하고 저장 진행): {e}")

    # --- [저장 로직] ---
    # 파일이 없으면 헤더를 쓰고, 있으면 덧붙임
    file_exists = os.path.exists(filename)
    
    with open(filename, 'a', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        
        if not file_exists:
            # 헤더에 '세부점수' 칸 추가됨
            writer.writerow(['날짜', '학번', '학년', '예측결과(1:우수/0:부진)', '취약과목', '세부점수'])
            
        writer.writerow([
            current_time.strftime("%Y-%m-%d %H:%M:%S"),
            student_id,
            year,
            prediction,
            weak_str,
            scores_str # 여기에 점수들이 저장됨
        ])
        print(f"💾 로그 저장 완료: {student_id}")

# --- [핵심] 예측 및 추천 API ---
@app.route('/predict', methods=['POST'])
def predict():
    if model_1 is None: return jsonify({'error': '모델 없음'}), 500
    try:
        data = request.get_json()
        student_id = data.get('student_id', '익명') # 학번 없으면 '익명'
        year = int(data.get('current_year', 0))
        
        # 1. 학년별 모델 선택
        if year == 1: model_ml, feats, next_txt = model_1, features_1, "2학년"
        elif year == 2: model_ml, feats, next_txt = model_2, features_2, "3학년"
        elif year == 3: model_ml, feats, next_txt = model_3, features_3, "4학년"
        else: return jsonify({'error': '학년 오류'}), 400

        # 2. 성과 예측 (머신러닝)
        input_df = pd.DataFrame([data], columns=feats).fillna(0.0)
        pred = model_ml.predict(input_df)[0]
        
        # 3. [다중 분석 로직] 취약점 분석
        input_scores = {k: v for k, v in data.items() if k in feats and v > 0}
        
        # 3.5(B+) 미만인 과목들을 모두 '취약 후보'로 뽑음
        weak_subjects = [k for k, v in input_scores.items() if v < 3.5]
        
        recs = []

        # 4. 반복문을 돌며 각각의 취약 과목 분석
        for weak_subj in weak_subjects:
            
            # (A) 이 과목의 다음 단계 과목은 무엇인가? (예: 통계학1 -> 통계학2)
            next_step_subj = SUBJECT_RELATIONS.get(weak_subj) 
            
            # (B) 다음 단계 과목을 이미 들었는가? 점수는?
            next_step_score = input_scores.get(next_step_subj, 0)
            
            # --- [Case 1: 잠재적 위험 (Hidden Risk)] ---
            # 하위 과목은 못했지만(weak_subj), 상위 과목은 잘함(A학점 등)
            # -> 당장은 괜찮지만 먼 미래가 위험함
            if next_step_subj and next_step_score >= 3.5:
                risk_info = HIDDEN_RISK_MAP.get(weak_subj) # 위험 매핑 확인
                if risk_info:
                    future_subj = risk_info['future']
                    msg = risk_info['msg']
                    # 추천 자료는 '기초 과목(weak_subj)' 것을 제공 (복습용)
                    info = SUBJECT_RESOURCES.get(weak_subj, SUBJECT_RESOURCES["DEFAULT"]) 
                    
                    recs.append({
                        "title": f"⚠️ 기초 재점검: {weak_subj}",
                        "url": info['url'],
                        "desc": f"✅ {next_step_subj} 성적은 좋지만, 기초({weak_subj}) 부족으로 '{future_subj}' 학습에 리스크가 있습니다. {msg}"
                    })
            
            # --- [Case 2: 직접적 위험 (Direct Risk)] ---
            # 하위 과목도 못했고, 상위 과목은 아직 안 들었거나 상위 과목도 망함
            # -> 당장 다음 학기가 위험함
            else:
                # 다음 단계 과목이 있으면 그것을, 없으면 '심화'라고 붙여서 추천
                target_subj = next_step_subj if next_step_subj else weak_subj + " 심화"
                # 추천 자료는 '다음 단계 과목(target_subj)' 것을 제공 (예습용)
                info = SUBJECT_RESOURCES.get(target_subj, SUBJECT_RESOURCES["DEFAULT"])
                
                recs.append({
                    "title": f"🚨 위험 경고: {target_subj}",
                    "url": info['url'],
                    "desc": f"'{weak_subj}' 이해도가 낮아 다음 단계인 '{target_subj}' 수업을 따라가기 벅찰 수 있습니다. 선행 학습이 시급합니다."
                })

        # 5. 전체 예측 멘트 및 결과 반환
        if pred == 0:
            prediction_text = f"⚠️ {next_txt} 학업 성취도가 낮을 것으로 우려됩니다."
            if not recs: # 점수 패턴상 낮은 경우
                 recs.append({"title": "전반적 학습량 부족", "url": "#", "desc": "특정 과목보다는 전체 평점을 높일 필요가 있습니다."})
        else:
            prediction_text = f"🎉 {next_txt} 학업 성취도가 우수할 것으로 예측됩니다!"
            if not recs: # 취약 과목 0개
                recs.append({"title": "커리어 도약", "url": "https://kaggle.com", "desc": "기초가 탄탄합니다. 실전 프로젝트로 넘어가세요!"})

        try:
            save_log(student_id, year, int(pred), weak_subjects, input_scores)
        except Exception as e:
            print(f"❌ 저장 실패: {e}")

        return jsonify({
            'prediction': int(pred), 
            'prediction_text': prediction_text, 
            'recommendations': recs
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 400

# [수정] app.py의 chat 함수 부분

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '')

    # --- [핵심 수정] 프롬프트를 '간결함'에 초점 맞춤 ---
    system_instruction = f"""
    당신은 대학교 '학습 도우미 AI'입니다.
    
    [보유 자료]
    {SUBJECT_RESOURCES}
    
    [답변 원칙]
    1. **절대 길게 말하지 마세요.** (최대 3문장)
    2. 서론/결론(인사말, 맺음말)을 생략하고 **본론만** 말하세요.
    3. 과목 추천 시 'url'과 '설명'을 짧게 요약해서 보여주세요.
    4. 가독성을 위해 **이모지**와 **줄바꿈**을 적극 활용하세요.
    5. 학생의 질문에 대해 공감하되, 해결책 위주로 답하세요.
    """

    try:
        # prompt 구조를 조금 더 명확하게 변경
        full_prompt = f"{system_instruction}\n\n[학생]: {user_input}\n[AI]:"
        response = model_ai.generate_content(full_prompt)
        return jsonify({'response': response.text})
    except:
        return jsonify({'response': "죄송합니다. 잠시 후 다시 시도해주세요. "})
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
