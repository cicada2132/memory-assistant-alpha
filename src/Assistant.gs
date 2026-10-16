// 기록 기반 대화 보조(규칙 기반). 외부 AI를 쓰지 않고, 저장된 블록만 근거로 답한다.
// 기록에 없는 내용은 만들지 않고 "확인된 기록이 없습니다"라고 답한다.
var JOSA_RE_ = /(에서는|에서|에게|한테|으로|로는|로|까지|부터|이랑|랑|하고|와|과|은|는|이|가|을|를|에|도|의|요)$/;
var STOP_ = ['뭐', '무엇', '뭘', '무슨', '언제', '어디', '누구', '누가', '했지', '했나', '했어', '했는지', '하려고', '하려', '했었지', '거', '것', '일', '나', '내가', '제가',
  '좀', '그', '그거', '그일', '어떻게', '됐지', '됐어', '있었지', '있어', '오늘', '어제', '그저께', '그제', '내일', '아까', '방금', '조금', '전', '전에', '이번', '지난', '주', '아침', '오전', '점심', '오후', '저녁', '밤',
  '끝냈나', '끝냈어', '끝냈지', '끝났나', '끝났어', '마쳤나', '할', '해야', '하기로', '했더라', '뭐였지', '알려줘', '말해줘'];
function keywords_(q) {
  return uniq_(String(q || '').replace(/[?？!.,~]/g, ' ').split(/\s+/).map(function (t) {
    t = t.trim(); var s = t.replace(JOSA_RE_, ''); return s.length >= 2 ? s : t;
  }).filter(function (t) { return t.length >= 2 && STOP_.indexOf(t) < 0 && !/^\d+(시|분|월|일)?$/.test(t); }));
}
// 질문에서 날짜 범위(KST)를 읽는다. 없으면 null.
function dateRange_(q, nowIso) {
  var today = kstDate_(nowIso), day = function (off) { return kstDate_(new Date(new Date(nowIso).getTime() + off * 86400000).toISOString()); };
  if (/(아까|방금|조금\s?전|\d+\s?분\s?전)/.test(q)) return { from: new Date(new Date(nowIso).getTime() - 3 * 3600000).toISOString(), to: nowIso, label: '최근 3시간' };
  var m = /(\d{1,2})\s?월\s?(\d{1,2})\s?일/.exec(q), d = null, label = '';
  if (m) { d = today.slice(0, 4) + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2); label = m[0]; }
  else if (/(그저께|그제)/.test(q)) { d = day(-2); label = '그저께'; }
  else if (/어제/.test(q)) { d = day(-1); label = '어제'; }
  else if (/오늘/.test(q)) { d = today; label = '오늘'; }
  if (d) return { date: d, label: label };
  if (/(이번\s?주|최근)/.test(q)) return { from: new Date(new Date(nowIso).getTime() - 7 * 86400000).toISOString(), to: nowIso, label: '최근 7일' };
  return null;
}
function inRange_(b, r) {
  var t = blockTime_(b);
  if (!r) return true;
  if (r.date) return kstDate_(t) === r.date;
  return t >= r.from && t <= r.to;
}
var TASK_LABEL_ = { open: '아직 안 끝남', done: '끝냄', dropped: '그만두기로 함' };
var SOURCE_LABEL_ = { self_statement: '직접 남긴 말', imported_transcript: '녹음 TXT', device_ai_summary: '녹음 앱 요약(자동 생성)', evening_answer: '저녁 정리 답' };
function cite_(b) {
  return { id: b.id, time: kstText_(blockTime_(b)), text: b.text, kind: b.kind, task: b.task ? TASK_LABEL_[b.task.status] : '',
    source: SOURCE_LABEL_[b.sourceType] || b.sourceType, sourceName: b.source && b.source.name ? b.source.name : '' };
}
function askLocal(question) {
  owner_(); var q = text_(question, 500), now = now_(), range = dateRange_(q, now), terms = keywords_(q);
  var isStatus = /(끝냈|끝났|마쳤|했나|했어\??$|했는지|했었나|완료)/.test(q);
  var isPlan = !isStatus && /(하려|할\s?일|해야|계획|예정|하기로|약속|다음)/.test(q);
  var pool = blocks_().filter(function (b) { return !b.deleted && inRange_(b, range); });
  var scored = pool.map(function (b) {
    var s = terms.reduce(function (n, t) { return n + ((b.text || '').indexOf(t) >= 0 || (b.people || []).indexOf(t) >= 0 || (b.places || []).indexOf(t) >= 0 ? 1 : 0); }, 0);
    return { b: b, s: s };
  }).filter(function (x) { return terms.length ? x.s > 0 : !!range; });
  if ((isPlan || isStatus)) scored = scored.filter(function (x) { return x.b.kind === 'plan' || (isStatus && x.b.kind === 'done'); });
  scored.sort(function (a, b) { return b.s - a.s || blockTime_(b.b).localeCompare(blockTime_(a.b)); });
  var hits = scored.slice(0, 5).map(function (x) { return x.b; });
  var scope = (range ? range.label + ' ' : '') + (terms.length ? '"' + terms.join(' ') + '"' : '');
  if (!hits.length)
    return { answer: '확인된 기록이 없습니다.' + (scope ? ' (' + scope.trim() + ' 기준)' : '') + ' 다른 단어나 날짜로 찾아볼 수 있습니다.', items: [], basis: 'local' };
  var lines = [];
  if (isStatus) {
    hits.forEach(function (b) {
      if (b.kind === 'plan') lines.push('· ' + kstText_(blockTime_(b)) + ' 할 일: "' + b.text.slice(0, 80) + '" → 기록상 ' + TASK_LABEL_[b.task.status]);
      else lines.push('· ' + kstText_(blockTime_(b)) + ' 한 일 기록: "' + b.text.slice(0, 80) + '"');
    });
    lines.unshift('기록에서 찾은 내용입니다. 실제로 끝냈는지는 직접 확인해 주세요.');
  } else {
    lines.push((isPlan ? '기록에 남은 할 일' : '관련 기록') + ' ' + hits.length + '건입니다.');
    hits.forEach(function (b) { lines.push('· ' + kstText_(blockTime_(b)) + ' — ' + b.text.slice(0, 100)); });
  }
  return { answer: lines.join('\n'), items: hits.map(cite_), basis: 'local' };
}
// 한 화면 맥락: 최근 사건(30분 이전 포함), 진행 중 할 일, 기록상 다음 할 일
function getNow() {
  owner_(); var now = now_(), since = new Date(new Date(now).getTime() - 6 * 3600000).toISOString();
  var all = blocks_().filter(function (b) { return !b.deleted; }).sort(function (a, b) { return blockTime_(b).localeCompare(blockTime_(a)); });
  var recent = all.filter(function (b) { return blockTime_(b) >= since && b.kind !== 'summary'; }).slice(0, 6);
  var open = all.filter(function (b) { return b.task && b.task.status === 'open'; }).slice(0, 6);
  var next = open.filter(function (b) { return /(오늘|이따|지금|곧|\d{1,2}\s?시)/.test(b.text); })[0] || open[0] || null;
  var cut = new Date(new Date(now).getTime() - 30 * 60000).toISOString();
  var before30 = all.filter(function (b) { return blockTime_(b) <= cut && b.kind !== 'summary'; })[0];
  return { now: kstText_(now), recent: recent.map(cite_), open: open.map(cite_), next: next ? cite_(next) : null, lastBefore30: before30 ? cite_(before30) : null };
}

// ---------- 저녁 정리 ----------
// 질문은 'This is me'의 주제(중요한 사람·장소, 선호, 일상 습관)를 참고해 새로 쓴 문구다(원문 복제 아님).
// 모두 선택 사항이며, 건너뛰기가 기본이다. profileKey가 있는 질문은 바로 반영하지 않고 '내 정보' 제안으로 남긴다.
var EVENING_QUESTIONS_ = [
  { id: 'tomorrow', text: '내일 챙길 일이 있나요?', choices: ['있어요', '없어요', '모르겠어요'] },
  { id: 'people', text: '오늘 만난 사람 중 기록해 둘 사람이 있나요?', choices: ['가족', '친구', '이웃', '돌봄 직원'] },
  { id: 'routine', text: '하루를 편하게 보내는 데 도움이 되는 습관이 있나요?', choices: ['아침 산책', '정해진 시간 식사', '라디오·음악', '낮잠'], profileKey: '도움이 되는 습관' },
  { id: 'callname', text: '다른 사람이 나를 어떻게 불러 주면 좋은가요?', choices: [], profileKey: '부르고 싶은 이름' },
  { id: 'food', text: '좋아하는 음식이나 음료가 있나요?', choices: ['커피', '차', '국수', '과일'], profileKey: '좋아하는 음식' },
  { id: 'place', text: '나에게 중요한 장소가 있나요?', choices: ['집', '고향', '자주 가는 공원', '교회·성당·절'], profileKey: '중요한 장소' }
];
function getEvening(date) {
  owner_(); var d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : kstDate_(now_());
  var all = blocks_().filter(function (b) { return !b.deleted; });
  var day = all.filter(function (b) { return kstDate_(blockTime_(b)) === d && b.kind !== 'summary'; }).sort(function (a, b) { return blockTime_(a).localeCompare(blockTime_(b)); });
  var open = all.filter(function (b) { return b.task && b.task.status === 'open' && kstDate_(blockTime_(b)) <= d; })
    .sort(function (a, b) { return blockTime_(b).localeCompare(blockTime_(a)); }).slice(0, 10);
  var seed = parseInt(d.replace(/-/g, ''), 10), qs = [EVENING_QUESTIONS_[0], EVENING_QUESTIONS_[1 + seed % (EVENING_QUESTIONS_.length - 1)]];
  return { date: d, count: day.length, timeline: day.slice(0, 30).map(cite_), open: open.map(cite_),
    done: day.filter(function (b) { return b.kind === 'done' || (b.task && b.task.status === 'done'); }).length, questions: qs };
}
// 사용자가 '저장'을 누른 답만 저장한다. 건너뛰면 아무것도 남기지 않는다.
function saveEveningAnswer(input) {
  owner_();
  var q = EVENING_QUESTIONS_.filter(function (x) { return x.id === input.questionId; })[0];
  if (!q) throw new Error('질문을 찾을 수 없습니다.');
  var answer = maskSensitive_(text_(input.answer, 500)), rid = id_(input.requestId);
  if (q.profileKey) { proposeProfile({ key: q.profileKey, value: answer, evidence: '저녁 정리에서 직접 답함 (' + kstDate_(now_()) + ')' }); return { proposed: true }; }
  var a = analyze_(answer, knownPeople_());
  return lock_(function () {
    return addBlock_({ kind: q.id === 'tomorrow' && input.choice !== '없어요' ? 'plan' : 'answer', text: q.text + ' → ' + answer, people: a.people, places: a.places,
      timeText: a.timeText, recordedAt: now_(), sourceType: 'evening_answer', source: { type: 'evening', question: q.id } }, 'evening:' + rid);
  });
}
