# External Memory Alpha (개인 기록 알파)

## 한 줄 요약
치매 환자 외장 기억 보조 프로젝트의 개인 기록 알파. GAS 웹 앱으로 대화 기록·TXT 수집·녹음 전사·기록 검색 챗봇을 제공한다. (보훈병원 프로젝트와 별개)

## 위치
- 작업 폴더: `G:\내 드라이브\ai부트캠프\memory-assistant-alpha` (G:\ 루트는 드라이브라 폴더 생성 불가 → 여기로 정함)
- Apps Script 프로젝트: External Memory Alpha, Script ID `1laN8UZp1gkVj3L5vxNV1BUek2At3kTEBVKtAqP1TlBT7RGLn2zS6WBe7`
- 원본 패키지: `G:\내 드라이브\ExternalMemory_Antigravity_GAS_20261016.zip` (지시서: ANTIGRAVITY_INSTRUCTIONS.md)
- 기존 사이트(브라우저 저장 알파, 이번 작업에서 건드리지 않음): https://personal-record-alpha-kg1016.workspace-301609.chatgpt.site

## 현재 상태 (2026-10-16)
- [x] 패키지를 작업 폴더에 풀고 코드 전체 검토
- [x] 모의 테스트 17개 통과 (`node tests/run.mjs`, 외부 호출 없음)
- [x] 빈 기존 프로젝트(1laN8…)에 `.clasp.json` 연결. 원격은 기본 manifest만 있었음(백업 확인)
- [x] 함수 이름 수정(사용자 승인): setup_→setup, enableInboxSync_→enableInboxSync, disableInboxSync_→disableInboxSync, 트리거 핸들러 inboxTrigger 추가. 테스트 17개 재통과
- [x] clasp push 완료 (7개 파일, 2026-10-16 10:44)
- [x] 웹 앱 배포 버전 1 (manifest: USER_ACCESSING / MYSELF)
  - 배포 ID: `AKfycbwNRbFl-q_P1vYnWPn8aNzPc85nAZs_J4G9j_fGb9_mM5UX7C_6PiFk9R2d_Clhi-0M`
  - 주소: https://script.google.com/macros/s/AKfycbwNRbFl-q_P1vYnWPn8aNzPc85nAZs_J4G9j_fGb9_mM5UX7C_6PiFk9R2d_Clhi-0M/exec
- [x] 2026-10-16 화면(src/Index.html) 디자인을 Genesis DESIGN.md 규칙으로 새로 작성. 버튼 ID·서버 호출은 그대로, 겉모양만 변경. 테스트 17개 통과, 가짜 데이터로 PC·휴대폰 화면 캡처 확인
  - 2026-10-16 14:47 clasp push(덮어쓰기) + 같은 배포 ID를 버전 3으로 갱신 (주소 그대로). 다른 배포 AKfycbzNVMk…(@2)도 있음 — 출처 미확인, 건드리지 않음
- [x] setup 실행 확인 (2026-10-16 10:47, Drive에 External Memory Alpha + RECORDS/AUDIO/INBOX/PROFILE 생성됨)
- [x] (2026-10-16) "API 작동 안 함" 문의 → 사용자 결정으로 OpenAI를 **Gemini로 전부 교체**. 대화·분석·녹음 전사 모두 generateContent 한 주소 사용. 스크립트 속성 GEMINI_API_KEY(필수), GEMINI_MODEL(없으면 gemini-2.5-flash). 오류 시 Google 오류 문구 앞 200자를 화면에 표시. 테스트 17개 통과. 2026-10-16 14:51 clasp push 완료(7개 파일). 같은 배포 ID를 버전 4(설명: Gemini 전환)로 갱신, /exec 주소 그대로
- [ ] 배포 설정 화면에서 "나만" 확인, 브라우저에서 /exec 열어 동작 확인
- [x] clasp push (2026-10-16 14:51)
- [x] clasp update-deployment → 버전 4 (2026-10-16)
- [ ] GEMINI_API_KEY 스크립트 속성 입력 (사용자가 직접). 옛 OPENAI_* 속성은 안 쓰므로 지워도 됨
- [ ] 실제 수용 테스트 (지시서 9장)

## 정한 결정과 이유
- AI 제공자: Gemini (2026-10-16 사용자 결정). 이유: 사용자가 Gemini 키 보유, 우선 실행이 목표. 녹음은 base64로 요청에 직접 넣음(8 MiB 제한이라 20MB 요청 한도 안). webm은 Gemini 공식 지원 형식이 아니라 실패할 수 있음.
- 새 프로젝트를 만들지 않고 이미 있던 빈 "External Memory Alpha"(1laN8…)를 사용. 이유: 이전 시도로 이미 생성돼 있었고 코드가 비어 있음.
- 같은 이름의 빈 프로젝트(1OYYq…)와 "제목 없는 프로젝트" 4개는 이전 시도 흔적. 삭제는 사용자 판단.
- 배포 설정: 실행 사용자 USER_ACCESSING, 액세스 MYSELF. 이유: 개인 기록(개인정보)이라 범위를 좁힘.

- 코드 수정 후 재배포: `clasp push` → `clasp update-deployment AKfycbwNRbFl-q_P1vYnWPn8aNzPc85nAZs_J4G9j_fGb9_mM5UX7C_6PiFk9R2d_Clhi-0M` (같은 주소 유지). push만으로는 /exec에 반영 안 됨.

- 디자인: Genesis(인디고 #6366F1 포인트, General Sans 제목 / DM Sans 본문 / JetBrains Mono 코드). 한글 글꼴이 이 셋에 없어서 Pretendard를 대체 글꼴로 추가. 어두운 모드 자동 지원. 글꼴 굵기는 400·600 두 가지만.

## GitHub 등록 (2026-10-16)
- 저장소: https://github.com/cicada2132/memory-assistant-alpha (Public, 브랜치 main)
- 커밋 작성자: cicada2132 / cicada2132@users.noreply.github.com (이 저장소에만 설정)
- 사용자 결정: **공개(Public)** 저장소. Script ID·/exec 주소가 공개되는 점은 안내함(액세스 "나만"이라 사용은 불가)
- [x] .gitignore에 desktop.ini 추가, `git init -b main`, 파일 16개 스테이징(backups/·.clasp.json 제외)
- [ ] 커밋: git 사용자 정보 미설정. 공개 저장소라 실제 Gmail 대신 `아이디@users.noreply.github.com` 사용 예정 → 사용자 GitHub 아이디 받으면 이 저장소에만 설정 후 커밋
- [ ] 사용자가 github.com에서 빈 저장소 생성(README 등 체크 안 함) → 주소 받아 `git remote add origin` + `git push -u origin main`
- 참고: gh CLI 미설치. 드라이브 폴더 안 .git은 동기화 충돌 가능성 있음(안내함)

## 다음 할 일
0. /exec 열어 새 디자인 실제 화면 확인 (내 정보 탭, 전송 확인 창, 어두운 모드 포함)
1. 편집기에서 setup 실행, 권한 승인
2. /exec 열어 키 없이 저장·검색·TXT·내 정보 테스트
3. 원하면 편집기에서 enableInboxSync 실행(TXT 5분 자동 수집)
4. GEMINI_API_KEY 입력 후 질문·분석·전사 테스트
