# 현재 코드 기준 설치·실행 안내

이 안내는 확인한 저장소 코드 기준이다. 실제 배포 작업을 이번 문서 정리에서 실행하지 않았다.

## 1. 로컬 검사

Node.js가 있는 환경에서 저장소를 내려받고 다음을 실행한다. 현재 테스트는 Node 표준 모듈을 사용한다.

```bash
node tests/run.mjs
```

`scripts/build-knowledge.mjs`는 원칙 문서와 캐릭터를 GAS 파일로 만든다. 기존 사용 안내는 `node scripts/build-knowledge.mjs` 및 `--check`다. 플랫폼별 직접 실행 진입 조건에 의존하므로 실행 후 실제 생성/검사 메시지가 나오는지 확인한다. 무출력 성공만으로 최신 상태라고 판단하지 않는다. 이번 검사에서는 export 함수들을 직접 호출해 비교했다.

## 2. Apps Script 연결

전용 Apps Script 프로젝트를 준비하고 `scripts/bind.mjs`에 실제 Script ID를 전달한다. 이 단계는 기존 `.clasp.json`을 바꾸므로 올바른 프로젝트인지 먼저 확인한다. 배포 도구는 Google clasp를 사용한다. 현재 명령은 공식 문서를 확인한다: https://github.com/google/clasp

```bash
node scripts/bind.mjs YOUR_SCRIPT_ID
```

`src`만 업로드되는지 확인하고 원격 코드를 백업한 뒤 push한다. Apps Script 편집기에서 `setup`을 실행하고 Google 권한을 승인한다. 현재 함수는 `setup_`가 아닌 **`setup`**이다.

## 3. 스크립트 속성

| 속성 | 현재 역할 |
|---|---|
| `GEMINI_API_KEY` | Gemini를 사용할 때 사용자가 직접 설정하는 키 |
| `GEMINI_MODEL` | 코드 기본값 `gemini-2.5-flash`; 실제 계정에서 사용할 수 있는 모델인지 별도 확인 |
| `EXTERNAL_AI_ENABLED` | 정확히 `true`일 때 외부 AI 허용. 기본 비활성 |
| `OWNER_EMAIL` | setup이 저장하는 소유자 계정 |
| `ROOT_FOLDER_ID`, `INBOX_FOLDER_ID` 등 | setup/사용 시 생성한 개인 저장소 위치 |

키는 코드·HTML·README·시연 화면에 기록하지 않는다. 예전 `OPENAI_*` 설정은 현재 소스의 AI 호출 설정이 아니다. 이번 작업은 키 생성·교체·API 실행을 포함하지 않는다.

## 4. 본인 전용 웹 앱

manifest는 `USER_ACCESSING` / `MYSELF`로 설정되어 있다. 배포 화면에서도 실행 사용자와 본인 전용 접근 설정이 맞는지 확인한다. push는 편집기 코드 업로드이고, 기존 `/exec`를 바꾸려면 배포 버전 갱신이 별도로 필요하다.

첫 실행은 키 없이 합성 텍스트 저장→검색→정정→삭제→내보내기를 확인한다. 외부 AI가 꺼져 있을 때 초기 상담 화면에서 오류가 나오면 기록·검색 경로로 이동한다. 현재 UI는 접속 시 상담 시작을 시도하므로 이 흐름의 사용성도 검사 대상이다.

## 5. TXT와 선택적 AI 시험

TXT 입력 폴더에 합성 파일을 올리고 수동 ‘TXT 가져오기’에서 후보 선택 저장을 확인한다. 자동 발견은 편집기의 `enableInboxSync`로 5분 주기 트리거를 만들며, 중지는 `disableInboxSync`다. 이는 휴대폰 파일 업로드 자동화를 뜻하지 않는다.

AI 시험 시에는 키와 활성 속성을 설정하고, 전송 내용을 직접 확인한다. 기록 검색 대화, 하루 상담, 원음 전사는 서로 다른 경로이므로 각각 시험한다. 실음성은 코드상 8 MiB 제한이며 장시간 녹음 전체 처리나 모든 MIME 지원을 보장하지 않는다.
