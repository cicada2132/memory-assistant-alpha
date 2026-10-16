# External Memory Alpha — Antigravity 전달 패키지

작성일: 2026-10-16 KST. 사용자 요청에 따라 키는 나중에 직접 입력한다.

`ANTIGRAVITY_INSTRUCTIONS.md`를 Antigravity에 전달하고 이 폴더 전체를 함께 제공한다.
코드는 구현되어 있으므로 처음부터 새로 만들 필요가 없다. 연결 확인 → 원격 백업 → 코드 검증 → push → 본인 전용 배포를 이어서 수행한다.

## 포함된 기능

- 단일 Index.html 대화 UI, 본인 진술 저장, 검색, 정정 이력, 삭제, JSON 내보내기.
- Google Drive 개인 폴더의 JSON 파일을 DB로 사용. Google Sheets 의존성 없음.
- INBOX의 UTF-8 TXT 수동/5분 주기 수집. 파일ID+내용 해시로 중복 방지.
- 녹음 업로드 → 외부 전송 동의 → 음성 전사 → 자동 사건 분석. 전사만 실행하는 경로도 제공.
- 관련 기록을 검색하고 전송 내용을 확인·편집한 뒤 AI에 질문.
- 자기정보는 변경 제안 → 승인/수정/거절. 보류는 미처리 상태로 유지.
- API 키 미설정이어도 저장·조회·TXT 가져오기·파일 업로드·내 정보 관리 가능.

## 빠른 설치

1. 전용 Apps Script 프로젝트의 Script ID를 확인한다. 보훈병원 GAS와 구분한다.
2. 이 폴더에서 `node scripts/bind.mjs 실제_SCRIPT_ID`를 실행한다.
3. `node tests/run.mjs`로 검사하고, `clasp show-file-status`로 src의 파일만 업로드되는지 확인한다.
4. 대상 프로젝트를 백업한 뒤 `clasp push`, `clasp open-script`를 실행한다.
5. Apps Script 편집기에서 `setup_`를 한 번 실행하고 Google 권한을 승인한다.
6. 배포 → 새 배포 → 웹 앱 → 실행 사용자: 접속 사용자 / 액세스 권한: 나만.
7. 생성된 /exec 주소에서 사용한다. `clasp push`만으로 기존 배포 URL의 코드가 갱신되지는 않는다. 수정 후 배포 버전도 갱신한다.

## API 키 입력 위치

Apps Script → 왼쪽 **프로젝트 설정(톱니바퀴)** → **스크립트 속성** → 속성 추가:

| 속성 | 입력값 |
| --- | --- |
| OPENAI_API_KEY | 사용자가 직접 입력하는 키 |
| OPENAI_MODEL | 기본 gpt-4.1-mini; 계정에서 사용 가능한 텍스트 모델로 변경 가능 |
| TRANSCRIPTION_MODEL | 기본 gpt-4o-mini-transcribe |

키를 HTML·Code.gs·지시서·Git·채팅에 넣지 않는다. 키를 설정한 뒤 화면을 새로고침한다.
`setup_`는 기존 키나 모델 설정을 덮어쓰지 않는다.

## TXT 자동 수집

사이트의 ‘TXT 입력 폴더 열기’에 .txt를 올린다. 기존 다른 폴더를 읽으려면 편집기의 INBOX_FOLDER_ID 속성을 **그 폴더 ID로** 변경한다.
이 폴더에는 이번 실험의 입력 파일만 넣는다. 하위 폴더는 검색하지 않는다.
처음은 ‘TXT 가져오기’로 확인하고, 자동 수집을 원하면 편집기에서 `enableInboxSync_`를 한 번 실행한다.
중지는 `disableInboxSync_`. 한 실행당 30개 파일을 검사하며 이후는 커서로 이어간다.
동일 파일·동일 내용은 재수집하지 않고, 같은 파일을 수정하면 새 기록으로 수집한다.

## 현재 한계

GAS/Drive는 Google 클라우드다. 로컬 원본 보관·로컬 전사라는 장기 설계를 구현한 것이 아니며, 개인/가상 데이터로 연결을 검증하는 별도 알파다. 기존 Python/SQLite 이행 패키지는 변경하지 않는다.

이 패키지를 기존 ChatGPT Sites에 자동 연결하거나 기존 브라우저 DB를 이전하지는 않았다. GAS의 독립 실행 UI다. 기존 사이트에서 GAS 본인 전용 웹 앱을 여는 연결은 후속 단계로 명시한다.

원음 8 MiB, 텍스트 30,000자, 분석 입력 앞 12,000자, 관련 기록 5개(각 1,800자), 저장소 1,000건의 알파 한도다. 한 시간 녹음 전체를 GAS에서 안정적으로 처리한다고 보장하지 않는다. 짧은 파일로 나누거나 후속 로컬 작업 큐로 처리한다.

검색은 단어 포함 방식이다. 자연어 질문의 동의어·한국어 조사·날짜 추론 및 임베딩 검색은 미구현이다. 먼저 ‘도서관’ 같은 핵심 단어로 시험한다.
타임스탬프 자막 정렬, 실시간 스트리밍, 상시 녹음, 하드웨어 연동은 미구현이다. 발생 시각을 모르면 null로 저장하며 저장 시각을 실제 사건 시각으로 바꾸지 않는다.

외부 전송 전 사용자가 확인·수정하는 절차를 제공한다. 자동 비식별화 완성을 주장하지 않는다. ‘전사+자동 분석’은 원음 전체와 생성 전사 앞 12,000자 전송에 한 번 동의하는 경로다. 원음은 전사 전에 자동 익명화되지 않는다.
`store:false`는 Responses 저장 옵션이며 모든 제공업체 로그가 남지 않는다는 보장이 아니다. 음성 전사에는 이 옵션을 보내지 않는다.
삭제는 본문·분석·이력을 지우고 원음을 Drive 휴지통으로 옮긴다. 원본 TXT·사용자 내보내기·Drive 휴지통까지 영구 삭제하지 않는다. 파일 내용이 바뀌면 별도 새 기록이 수집될 수 있다.

## 검증 상태

17개 로컬 모의 테스트 통과. 실제 Google 권한 승인, Drive 실행, 브라우저 UI, 예약 트리거, OpenAI 호출, clasp push 및 배포는 사용자 PC에서 확인해야 한다. Script ID/Drive 폴더 ID/키를 임의로 채우지 않았다.

## 근거 및 기술 문서

- clasp 공식 명령 및 push 동작: https://github.com/google/clasp
- GAS 본인 전용 웹 앱 설정: https://developers.google.com/apps-script/manifest/web-app-api-executable
- GAS 웹 앱: https://developers.google.com/apps-script/guides/web
- OpenAI 전사 API: https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create
- Responses API: https://developers.openai.com/api/docs/guides/text

기존 설계 문서 `PROJECT_MEMORY_v0.2(2).md`와 `PROJECT_MEMORY(2).md` v0.4에서 현재 자기결정, 출처 분리, This is me 참고, 자기정보 갱신 승인 원칙을 반영했다. 원본 서식을 복제하지 않았다.
