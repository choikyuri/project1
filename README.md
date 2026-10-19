# project1

Spring Boot + React + Python으로 만든 1차 프로젝트입니다.

## 폴더 구조

| 폴더 | 내용 | 기술 |
| --- | --- | --- |
| `backend` | API 서버 | Java, Spring Boot, Gradle |
| `frontend` | 화면 | React, Vite |
| `analysis` | 데이터 분석·AI 기능 | Python, OpenAI API |

## 실행 전 설정 (처음 한 번)

비밀 키 파일은 GitHub에 올리지 않습니다. 예시 파일을 복사한 뒤 키를 입력하세요.

```bash
cp backend/src/main/resources/secret.yml.example backend/src/main/resources/secret.yml
cp analysis/.env.example analysis/.env
```

| 파일 | 입력할 값 |
| --- | --- |
| `backend/src/main/resources/secret.yml` | `weather.api-key` |
| `analysis/.env` | `OPENAI_API_KEY` |

## 실행 방법

### backend

```bash
cd backend
./gradlew bootRun
```

### frontend

```bash
cd frontend
npm install
npm run dev
```

### analysis

```bash
cd analysis
python -m venv .ven
source .ven/Scripts/activate
pip install -r requirements.txt
python main.py
```

## 작성자

- GitHub: [choikyuri](https://github.com/choikyuri)
