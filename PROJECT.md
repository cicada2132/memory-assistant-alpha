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
- [x] **2026-10-16 15:00 CEMM 블록 구조 반영 (로컬만, push·배포 안 함)** — 근거·계획은 `CEMM_분석_및_계획.md`
  - 새 파일 `src/Blocks.gs`(블록 DB·TXT 해석·승인형 수집), `src/Assistant.gs`(기록 기반 챗봇·지금 화면·저녁 정리)
  - 수정: MemoryService(syncInbox/inboxTrigger → 확인 대기 등록만), ChatService(외부 AI 게이트·프라이버시 게이트, Gemini 코드는 유지), Code(getStatus), Database(내보내기에 blocks), Index.html(4개 탭: 대화/기록 찾기/저녁 정리/내 정보)
  - 발견한 버그: Galaxy 녹음 TXT는 **UTF-16**인데 예전 코드가 UTF-8로 읽어 Drive RECORDS의 txt_ 기록 2건이 깨진 글자로 저장됨 → 새 코드는 BOM을 보고 해석
  - 테스트 22개 통과, 가짜 데이터로 휴대폰 폭 화면 3개 캡처·JS 오류 없음 확인
  - 백업: `backups/src_20261016_before_cemm/` (Gemini 전환본)
  - 이 시점 코드가 다른 세션의 git 첫 커밋(5da3e92)에 포함됨. 커밋 후 바뀐 파일: Index.html(체크박스 CSS), TEST_RESULTS.txt, PROJECT.md, CEMM_분석_및_계획.md
- [x] **2026-10-16 15:05 하루 기록 상담 추가 (15:08 다른 세션이 버전 5로 함께 배포)**
  - 새 파일 `src/Counsel.gs`: prepareCounsel(date)(그날 기록 미리보기, 자동 가림) → counsel({context,history,message,consent})(Gemini 다회 대화). 서버는 상담 내용 저장 안 함
  - Index.html: 위쪽 배너 "하루 기록 상담"(날짜+상담 시작), 새 탭 '하루 상담'(id counsel). 답은 큰 자막(30px, 문장별 강조) + 기기 내장 한국어 음성. 🎤 말로 입력(브라우저 음성 인식, GAS 화면에서 막힐 수 있음)
  - 테스트 23개 통과(상담 테스트 1개 추가). 가짜 데이터로 PC·휴대폰 화면 캡처 확인. 휴대폰 폭에서 메뉴 5개가 꺾이던 것 수정
  - 확인 못 함: 실제 Gemini 답, 실제 음성 재생, 마이크 동작
- [x] **2026-10-16 상담 AI가 CEMM 원본 문서를 항상 참조 (로컬만, 커밋·push·배포 안 함)**
  - `knowledge/`: `ai부트캠프/CEMM_Antigravity_Pack` 원본 6개 파일을 그대로 복사(desktop.ini 제외, 내용 동일 확인)
  - `scripts/build-knowledge.mjs`: knowledge/ md 5개(README 읽는 순서, sources.json은 SOURCES.md와 중복이라 제외)를 `src/Knowledge.gs`의 `KNOWLEDGE_` 문자열로 묶음(약 1.1만 자). `--check`로 최신인지 검사
  - `src/Counsel.gs`: `counselInstructions_()` = 상담 규칙 + 원칙 문서. 매 상담 요청의 systemInstruction에 들어감
  - 테스트 24개 통과(원본이 실제 요청에 들어가는지 확인 1개 추가). 실제 Gemini 답은 확인 못 함
- [x] **2026-10-16 15:08 배포 (사용자 요청)** — 위 CEMM·하루 상담·Knowledge 전부. 테스트 24개 통과 확인 후 `clasp push --force`(11개 파일) → `clasp create-version` = **버전 5** → `clasp redeploy AKfycbwNRbFl… -V 5`. /exec 주소 그대로
  - 되돌리기: `clasp redeploy AKfycbwNRbFl-q_P1vYnWPn8aNzPc85nAZs_J4G9j_fGb9_mM5UX7C_6PiFk9R2d_Clhi-0M -V 4` (Gemini 전환본)
  - 배포 후 실제 화면·Drive 동작은 아직 확인 안 함(사용자 확인 필요). BLOCKS·SYSTEM 폴더는 처음 쓸 때 자동 생성됨
  - git: 이 배포 내용은 아직 커밋 안 됨(첫 커밋 5da3e92 이후 변경분)
- [x] **2026-10-16 상담 캐릭터: 고양이 "모리" md 작성 (파일만, 코드 연결 안 함)**
  - 원본: ClawSouls `clawsouls/mori` v1.2.0(어르신 돌봄 로봇, CC-BY-4.0). `https://clawsouls.ai/api/v1/bundle/clawsouls/mori`로 파일만 받음(npx 실행 안 함) → `character/source_mori/`에 그대로 보관
  - 고친 파일: `character/SOUL.md` — 사람 흉내 안 내는 고양이, 존댓말, 행동은 괄호로 한 번, "냥" 금지, 기록에 없는 일 지어내지 않기, 위기 시 119·109 안내. 맨 위에 출처·라이선스·바꾼 점 표시
  - 아직 `src/Counsel.gs`의 COUNSEL_PROMPT_와 연결 안 함. 화면에 고양이 그림도 없음

- [x] 2026-10-16 접속 즉시 하루 상담 자동 시작(Index.html): 시작 시 run 안에서 loadNow 뒤 startCounsel(오늘 날짜) 호출 → 상담 탭 + 전송 확인 창 자동 표시. 날짜 바꾸면(bannerDate onchange) 그 날짜로 다시 시작, 상담 시작 버튼은 남김. 테스트 24개 통과. (배포 버전 5는 이 수정 전, ai-7e 세션이 15:08 올림)
- [x] **2026-10-16 15:15 배포 버전 6 (사용자 요청)** — 위 '접속 즉시 하루 상담' 포함. 테스트 24개 통과 확인 → push(11개) → 버전 6 → `clasp redeploy AKfycbwNRbFl… -V 6`. 주소 그대로. 되돌리기는 `-V 5`. 고양이 '모리'(character/)는 코드에 연결 안 된 상태라 배포 영향 없음. 실제 화면 확인 안 함
- [x] **2026-10-16 모리 연결** — 15:18 배포(사용자 요청): 테스트 25개·build --check 통과 → `clasp push --force`(12개 파일) → `clasp create-version` = **버전 7** → `clasp redeploy AKfycbwNRbFl… -V 7`. /exec 주소 그대로. 상담 자동 시작 수정도 포함. 되돌리기: `-V 5` (모리만 빼고 자동 시작은 유지하려면 `-V 6`, ai-7e 확인 2026-10-16 15:20: 배포 @7 맞음)
  - `scripts/build-knowledge.mjs`가 `character/SOUL.md` → `src/Character.gs`(CHARACTER_)도 만들도록 확장. SOUL.md 고친 뒤 이 스크립트 실행
  - `Counsel.gs` counselInstructions_: 상담 규칙 → 캐릭터 설정 → 원칙 문서 순. "캐릭터가 규칙과 부딪히면 규칙 우선", 행동은 맨 앞 괄호 한 번
  - 화면: 자막 왼쪽(휴대폰은 위)에 고양이 그림(인라인 SVG). 눈 깜빡임·꼬리 살랑, 읽는 동안 고개 끄덕, "(골골)"이면 몸 떨기. 괄호 행동은 작은 글씨로만 보이고 소리로 안 읽음. 이름표 '모리'. CC BY 4.0 출처 표시 추가
  - 테스트 25개 통과(캐릭터 테스트 1개 추가). 가짜 데이터로 PC·휴대폰 캡처 확인. 실제 Gemini 말투는 확인 못 함

## 정한 결정과 이유
- 상담 자동 시작 시에도 전송 확인(동의) 창은 유지 (2026-10-16 사용자 결정). 이유: 개인 기록이 Gemini로 나가기 전 안전장치.
- (2026-10-16 캐릭터) 사용자 결정: 상담 캐릭터는 동물, **의인화 안 한 그냥 고양이**. 직접 쓰지 않고 무료 사이트 md를 받아 고침. 이름은 원본을 따라 "모리"(라틴어 '기억'에서 옴) — 바꿀 수 있음
- (2026-10-16 원본 참조) 원본은 `knowledge/`에서만 고치고, 고친 뒤 `node scripts/build-knowledge.mjs` → push·배포. 이유: clasp는 src만 올리고, AI는 요청에 담긴 글만 읽기 때문. 실행 중 GitHub에서 읽는 방식은 GitHub 장애 시 상담이 멈춰서 안 씀
- (2026-10-16 원본 참조) 원칙 문서는 "대화 태도·금지사항 기준"으로만 쓰게 지시. 문서 속 개발 지시는 무시, 연구 내용을 사용자 경험처럼 말하지 않게 함. 이유: 지시서의 기억 오염 방지 원칙
- (2026-10-16 원본 참조) 상담(Counsel.gs)에만 적용. 질문 챗봇(ChatService)·기록 분석에는 아직 안 넣음
- (2026-10-16 상담) 상담도 기존 규칙 유지: 시작 때 보낼 기록을 보여 주고 동의받음. 이후 매 턴은 승인한 기록 + 지난 대화(최근 16개) + 새 말만 전송. 새 말의 연락처·등록한 이름은 자동 가림
- (2026-10-16 상담) 음성 출력은 speechSynthesis 기기 내장(localService) 음성만. 이유: 글이 외부 음성 서버로 가지 않게(기존 speak()와 같은 원칙). 없으면 자막만
- AI 제공자: Gemini (2026-10-16 사용자 결정). 이유: 사용자가 Gemini 키 보유, 우선 실행이 목표. 녹음은 base64로 요청에 직접 넣음(8 MiB 제한이라 20MB 요청 한도 안). webm은 Gemini 공식 지원 형식이 아니라 실패할 수 있음.
- 새 프로젝트를 만들지 않고 이미 있던 빈 "External Memory Alpha"(1laN8…)를 사용. 이유: 이전 시도로 이미 생성돼 있었고 코드가 비어 있음.
- 같은 이름의 빈 프로젝트(1OYYq…)와 "제목 없는 프로젝트" 4개는 이전 시도 흔적. 삭제는 사용자 판단.
- 배포 설정: 실행 사용자 USER_ACCESSING, 액세스 MYSELF. 이유: 개인 기록(개인정보)이라 범위를 좁힘.

- 코드 수정 후 재배포: `clasp push` → `clasp update-deployment AKfycbwNRbFl-q_P1vYnWPn8aNzPc85nAZs_J4G9j_fGb9_mM5UX7C_6PiFk9R2d_Clhi-0M` (같은 주소 유지). push만으로는 /exec에 반영 안 됨.

- (2026-10-16 CEMM) 전체 대화는 저장하지 않고 사용자가 고른 **정보 블록**만 저장. 이유: 지시서 "전체 대화 원본 영구 저장 금지". TXT 원본은 사용자 Drive INBOX에 남음(앱이 지우지 않음)
- (2026-10-16 CEMM) 외부 AI는 기본 꺼짐: 스크립트 속성 `EXTERNAL_AI_ENABLED`=`true`일 때만 Gemini 호출. 챗봇 기본 답은 외부 전송 없는 규칙 기반 검색. 이유: 지시서 8항
- (2026-10-16 CEMM) 블록 DB는 Drive JSON 월별 파일(BLOCKS 폴더, 처음 쓸 때 자동 생성). 이유: 기존 'Drive JSON, 시트 없음' 결정 유지, 파일 1개씩 읽던 방식보다 빠름. 새 OAuth 권한 필요 없음
- (2026-10-16 CEMM) 내 정보 항목 `등록한 사람`(쉼표 구분) = 기록에서 사람 찾기 + 외부 전송 시 자동 가림 목록
- 디자인: Genesis(인디고 #6366F1 포인트, General Sans 제목 / DM Sans 본문 / JetBrains Mono 코드). 한글 글꼴이 이 셋에 없어서 Pretendard를 대체 글꼴로 추가. 어두운 모드 자동 지원. 글꼴 굵기는 400·600 두 가지만.

## GitHub 등록 (2026-10-16)
- 저장소: https://github.com/cicada2132/memory-assistant-alpha (Public, 브랜치 main)
- 커밋 작성자: cicada2132 / cicada2132@users.noreply.github.com (이 저장소에만 설정)
- 사용자 결정: **공개(Public)** 저장소. Script ID·/exec 주소가 공개되는 점은 안내함(액세스 "나만"이라 사용은 불가)
- [x] .gitignore에 desktop.ini 추가, `git init -b main`, 파일 16개 스테이징(backups/·.clasp.json 제외)
- [x] 첫 커밋 5da3e92, `git push -u origin main` 완료 (2026-10-16)
- 이후 올리는 법: `git add -A` → `git commit -m "설명"` → `git push` (사용자가 요청할 때만)
- 주의: 공개 저장소이므로 실제 기록·API 키·개인정보 파일은 커밋 금지. 키는 스크립트 속성에만 둔다
- 참고: gh CLI 미설치. 드라이브 폴더 안 .git은 동기화 충돌 가능성 있음(안내함)

- [x] **2026-10-16 15:07 clasp push (11개 파일)** — CEMM 블록 구조 + 하루 상담 + 원본 참조가 편집기에 올라감. push 전 원격을 임시 폴더로 받아 14:51 push본(backups/src_20261016_before_cemm)과 같음을 확인(편집기 직접 수정 없었음). **배포 갱신은 안 함 → /exec는 아직 버전 4(Gemini 전환본)**

## 다음 할 일
- (원본 참조) 배포 갱신(`clasp update-deployment AKfycbwNRbFl…`, 사용자 확인 후) → 실제 상담에서 원칙대로 답하는지 확인 → git 커밋·push(요청 시)
0. /exec 열어 새 디자인 실제 화면 확인 (내 정보 탭, 전송 확인 창, 어두운 모드 포함)
1. 편집기에서 setup 실행, 권한 승인
2. /exec 열어 키 없이 저장·검색·TXT·내 정보 테스트
3. 원하면 편집기에서 enableInboxSync 실행(TXT 5분 자동 수집)
4. GEMINI_API_KEY 입력 후 질문·분석·전사 테스트 (CEMM 반영 후에는 EXTERNAL_AI_ENABLED=true도 필요)
5. (CEMM) 사용자 확인 후 `clasp push` → `clasp update-deployment AKfycbwNRbFl…` 로 새 화면 반영
6. (CEMM) 배포 후: 기록 찾기 → 새 TXT 확인 → INBOX의 녹음 TXT 2개 살펴보기·선택 저장 → 대화에서 "아까 뭐 하려고 했지?" 질문 → 저녁 정리 확인
7. (CEMM) '이전 방식 기록'의 깨진 txt_ 기록 2건은 새 방식으로 다시 가져온 뒤 삭제할지 사용자 결정
8. (CEMM) 미해결 목록은 `CEMM_분석_및_계획.md` 4장
9. (캐릭터) 버전 7 배포됨. /exec에서 모리 말투·그림 움직임·목소리 실제 확인
