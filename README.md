# External Memory Alpha

### 사용자의 생각과 선택을 돕는 개인 외장 기억 보조 도구

일상 대화와 기록에서 사용자가 선택한 정보를 보관하고, 출처가 있는 기록을 다시 찾아 대화할 수 있도록 만든 연구 기반 웹 프로토타입입니다. 치매 환자의 기억 공백과 자기결정권을 함께 고려하며, 사회복지·인간 중심 AI·소프트웨어 설계를 연결합니다.

**핵심 질문:** “AI가 과거를 대신 확정하지 않으면서, 사람이 자신의 기록으로 지금의 상황을 이해하도록 도울 수 있을까?”

> 상태: 연구·개발 알파 / 문서 정리: 2026-10-22 KST / 현재 구현: Google Apps Script + Drive JSON + 선택적 Gemini
>
> 로컬 모의 테스트 25개 재실행 통과. 실제 Google·Gemini 통합 실행 및 사용자 효과 검증과는 구분합니다. 진단·치료 제품이 아닙니다.

## 어떤 문제를 다루나요?

대화를 녹음하거나 일기를 저장해도, 나중에 필요한 순간에 “무엇을 하려 했는지”, “어디까지 했는지”, “이 기록이 누구의 말인지”를 이해하는 일은 남습니다. 이 프로젝트는 저장된 문장을 검색하는 기능에 **시간·출처·진행 상태·사용자 승인**을 연결합니다.

외부 기록을 자신의 삶을 이해하는 단서로 활용하되, 기록을 실제 회상이라고 믿게 만들거나 과거 선택을 현재의 의사보다 우선하지 않는 것이 설계의 중심입니다.

## 구현한 흐름

1. 직접 기록을 남기거나 Drive INBOX의 TXT를 확인합니다.
2. TXT에서 추출된 후보를 살펴보고 **선택한 정보만 블록으로 저장**합니다.
3. 기록·날짜·할 일 상태를 규칙 기반 검색으로 찾습니다. 외부 AI 없이도 이 경로를 사용할 수 있습니다.
4. 원하는 경우 전송할 내용을 확인·수정·승인한 뒤 Gemini와 하루 기록을 이야기합니다.
5. 정정, 삭제, 할 일 상태 변경, 자기정보 승인 여부를 사용자가 결정합니다.

현재 GAS는 Google 클라우드에서 동작합니다. “외부 AI 없이 검색”은 “기기 내 오프라인 처리”라는 뜻이 아닙니다.

## 주요 기능과 검증 범위

| 기능 | 현재 상태 | 근거 |
|---|---|---|
| 직접 기록·정정 이력·삭제·JSON 내보내기 | 코드 및 관련 모의 테스트 확인 | `Blocks.gs`, `MemoryService.gs`, `Database.gs` |
| UTF-8/UTF-16 TXT, 승인 대기, 선택 저장, 중복 방지 | 코드 및 모의 테스트 확인 | `Blocks.gs` |
| 날짜·키워드·할 일 질문에 대한 규칙 기반 답변 | 코드 및 모의 테스트 확인 | `Assistant.gs` |
| 최근 기록·미완료 작업·저녁 정리 | 코드 및 모의 테스트 확인 | `Assistant.gs` |
| 외부 AI 기본 비활성화·전송 확인·일부 개인정보 가림 | 코드 및 모의 테스트 확인 | `ChatService.gs` |
| 하루 상담·큰 자막·기기 내장 한국어 음성·모리 | 코드 확인, 서버 경로 일부 모의 테스트 | `Counsel.gs`, `Index.html` |
| 녹음 파일 업로드·Gemini 전사·분석 | 별도 RECORDS 경로 구현, 모의 테스트 | `AudioService.gs` |
| 휴대폰 → Drive 자동 업로드·온디바이스 전사 | 현재 저장소의 완성 기능 아님 | 후속 계획 |
| 치매 환자 사용성·기억/정체성 보조 효과 | 미평가 | 연구 질문 |

주의: 녹음 전사 결과를 승인형 블록·하루 상담에 자동 연결하는 전체 과정은 완료로 표현하지 않습니다. [구현 현황](docs/STATUS.md)을 참고하세요.

## 설계의 특징

- **출처 분리:** 직접 진술, 녹음 전사, 기기 생성 요약, AI 해석을 같은 사실로 합치지 않습니다.
- **사용자 통제:** 저장할 문장과 자기정보 변경을 선택할 수 있습니다.
- **단계적 자동화:** TXT 발견은 자동화하고, 기억 저장 여부는 확인하는 구조입니다.
- **근거 기반 대화:** 없는 기록은 없다고 답하도록 설계했습니다. 생성형 답변의 오류 가능성은 별도 평가 대상입니다.
- **연구와 구현의 연결:** 분산 기억·서사적 정체성 논의와 개인 중심 돌봄 자료를 기능 설계에 연결했습니다. 이것이 앱의 임상 효과를 입증하지는 않습니다.

## 기술 구성

| 영역 | 현재 선택 |
|---|---|
| 웹 UI | HTML / CSS / JavaScript, Apps Script HTML Service |
| 서버 | Google Apps Script V8 |
| 데이터 | 개인 Google Drive의 JSON 파일, 월별 정보 블록 |
| 검색 | 규칙·키워드·날짜 범위, 결과 최대 5건 |
| 선택적 생성 AI | Gemini `generateContent`, 모델은 Script Properties에서 설정 |
| 음성 출력 | Web Speech API의 `localService` 한국어 음성 |
| 검사 | Node.js `vm`과 모의 Google 서비스, 기존 테스트 25개 |

## 시작하기

기존 저장소에서 다음 검사를 실행할 수 있습니다. 실제 사용을 위한 프로젝트 연결과 배포는 [설치 안내](docs/SETUP.md)를 따릅니다.

```bash
git clone https://github.com/cicada2132/memory-assistant-alpha.git
cd memory-assistant-alpha
node tests/run.mjs
```

현재 키 이름은 `GEMINI_API_KEY`이며, 외부 AI 실행에는 `EXTERNAL_AI_ENABLED=true`도 필요합니다. 키는 Apps Script의 스크립트 속성에만 입력합니다. 초기 README의 `OPENAI_API_KEY`, `setup_` 안내는 현재 코드 기준으로 오래된 설명입니다.

## 문서 안내

| 문서 | 내용 |
|---|---|
| [프로젝트 배경](docs/OVERVIEW.md) | 문제 정의, 사회복지·철학적 방향, 범위 |
| [아키텍처](docs/ARCHITECTURE.md) | 실제 데이터 흐름과 장기 로컬 우선 설계 |
| [데이터 모델](docs/DATA_MODEL.md) | 블록, 출처, 시각, 수정·삭제 의미 |
| [연구 근거](docs/RESEARCH.md) | 채택 자료, 적용 범위, 미검증 가설 |
| [윤리·프라이버시](docs/ETHICS.md) | 자기결정, 기억 오염, 전송·보존 경계 |
| [현재 구현·평가](docs/STATUS.md) | 코드 확인, 모의 검사, 미검증 항목 |
| [설치 안내](docs/SETUP.md) | 현재 Gemini/GAS 구성 |
| [개발 결정 이력](docs/DECISIONS.md) | 설계 변화와 문서 충돌 정리 |
| [로드맵](docs/ROADMAP.md) | 우선순위와 완료 조건 |
| [해커톤 시연](docs/DEMO.md) | 3분 구성, 합성 데이터, 실패 시 대안 |
| [포트폴리오 소개](docs/PORTFOLIO.md) | 짧은 소개와 기술적 설명, 예상 질문 |
| [정리 근거](docs/SOURCE_AUDIT.md) | 확인한 커밋·자료, 이번 작업 범위 |

## 연구 출발점

- Richard Heersmink (2022), *Preserving Narrative Identity for Dementia Patients: Embodiment, Active Environments, and Distributed Memory*, Neuroethics 15, 8. [DOI](https://doi.org/10.1007/s12152-022-09479-x)
- Alzheimer's Society, [This is me](https://www.alzheimers.org.uk/get-support/publications-factsheets/this-is-me)

## 한계와 기여

이 프로젝트의 현재 기여는 새로운 치료 효과의 발견이 아니라, **사용자의 주체성을 출처·승인·정정·전송 제어라는 구체적 소프트웨어 구조로 옮긴 것**입니다. 검색 품질, 화자 구분, 민감정보 누락, 실제 사용 부담과 통합 동작은 추가 검증이 필요합니다.

모리 캐릭터 설정은 ClawSouls Mori v1.2.0을 수정한 자료이며 원본의 CC BY 4.0 출처·변경 고지를 유지합니다. 저장소 전체 코드의 라이선스와 동일하게 취급하지 않습니다. 원 저장소의 최상위 코드 라이선스는 별도 확정이 필요합니다.
