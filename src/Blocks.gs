// 정보 블록 저장소. 전체 대화 원문은 저장하지 않고, 사용자가 고른 블록만 월별 JSON에 둔다.
// 블록: { id, kind(plan|done|event|note|answer|summary), text, speaker, people, places, timeText,
//         occurredAt, timeSource, recordedAt, sourceType, source, task{status}, createdAt, revision, history, deleted }
var KST_MS_ = 9 * 3600 * 1000;
function kstDate_(iso) { return iso ? new Date(new Date(iso).getTime() + KST_MS_).toISOString().slice(0, 10) : ''; }
function kstText_(iso) { return iso ? new Date(new Date(iso).getTime() + KST_MS_).toISOString().slice(0, 16).replace('T', ' ') : '시각 모름'; }
function blockTime_(b) { return b.occurredAt || b.recordedAt || b.createdAt; }
function hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
// BLOCKS/SYSTEM 폴더는 기존 설치(setup 재실행 없이)에서도 쓰도록 처음 필요할 때 만든다.
function ensureFolder_(key) {
  var p = props_();
  if (!p.getProperty(key + '_FOLDER_ID'))
    p.setProperty(key + '_FOLDER_ID', DriveApp.getFolderById(required_('ROOT_FOLDER_ID')).createFolder(key).getId());
  return folder_(key);
}
function shardName_(id) { var m = /^b(\d{2})(\d{2})_/.exec(id); if (!m) throw new Error('잘못된 블록 ID'); return 'blocks-20' + m[1] + '-' + m[2] + '.json'; }
function blocks_() {
  var it = ensureFolder_('BLOCKS').getFiles(), all = [];
  while (it.hasNext()) {
    var f = it.next();
    if (/^blocks-\d{4}-\d{2}\.json$/.test(f.getName())) all = all.concat(JSON.parse(f.getBlob().getDataAsString('UTF-8')));
  }
  return all;
}
function shard_(id) { ensureFolder_('BLOCKS'); return read_('BLOCKS', shardName_(id)) || []; }
function block_(id) {
  var b = shard_(id_(id)).filter(function (x) { return x.id === id; })[0];
  if (!b || b.deleted) throw new Error('블록을 찾을 수 없습니다.');
  return b;
}
function putBlock_(b) { // 호출하는 쪽에서 lock_ 안에서 사용
  var list = shard_(b.id), i = list.map(function (x) { return x.id; }).indexOf(b.id);
  if (i >= 0) list[i] = b; else list.push(b);
  write_('BLOCKS', shardName_(b.id), list);
  return b;
}
function newBlockId_(seed) { var d = kstDate_(now_()); return 'b' + d.slice(2, 4) + d.slice(5, 7) + '_' + hex_(seed).slice(0, 20); }
// 새 블록 추가. 같은 seed는 같은 ID → 중복 저장되지 않음.
function addBlock_(fields, seed) {
  var id = newBlockId_(seed), old = shard_(id).filter(function (x) { return x.id === id; })[0];
  if (old) return old;
  var b = { id: id, kind: 'note', text: '', speaker: '', people: [], places: [], timeText: [], occurredAt: null, timeSource: null,
    recordedAt: null, sourceType: 'self_statement', source: null, task: null, createdAt: now_(), revision: 1, history: [] };
  Object.keys(fields).forEach(function (k) { b[k] = fields[k]; });
  if (b.kind === 'plan' && !b.task) b.task = { status: 'open', changedAt: b.createdAt };
  return putBlock_(b);
}

// ---------- 문장 신호(규칙 기반, 외부 AI 없음) ----------
var PLAN_RE_ = /(하려고|하려|할\s?거|할게|할\s?예정|하기로|가려고|가기로|갈\s?거|만나기로|야\s?(해|하|한|돼|된|겠|지)|챙겨|잊지\s?말|예약|약속|내일|모레|다음\s?주|이따가?|나중에)/;
var DONE_RE_ = /(했다|했어|했어요|했습니다|했지|끝냈|끝났|마쳤|다녀왔|다녀옴|먹었|받았|샀다|샀어|갔다\s?왔|완료)/;
var TIME_RE_ = /(오전|오후|아침|점심|저녁|밤|새벽|\d{1,2}\s?시(\s?\d{1,2}\s?분|\s?반)?|\d{1,2}\s?월\s?\d{1,2}\s?일|어제|오늘|내일|모레|그저께|그제)/g;
var PLACE_RE_ = /(병원|약국|은행|우체국|마트|시장|도서관|복지관|주민센터|센터|교회|성당|절|공원|회사|학교|식당|미용실|목욕탕|경로당|집)/g;
var ROLE_RE_ = /(딸|아들|아내|남편|엄마|어머니|아빠|아버지|할머니|할아버지|손자|손녀|며느리|사위|언니|오빠|형|누나|동생|친구|선생님|의사|간호사|요양보호사|복지사|이웃)/g;
function uniq_(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
function knownPeople_() {
  var v = ((read_('PROFILE', 'current.json') || { values: {} }).values || {})['등록한 사람'] || '';
  return uniq_(v.split(/[,，、\n]/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 2; }));
}
// 저장 전 자동 가림: 전화번호, 주민번호, 이메일, 카드·계좌처럼 긴 숫자
function maskSensitive_(t) {
  return String(t)
    .replace(/\b\d{6}\s?-\s?[1-4]\d{6}\b/g, '[주민번호]')
    .replace(/(01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '[전화번호]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[이메일]')
    .replace(/\d[\d-]{10,}\d/g, '[번호]');
}
function analyze_(text, people) {
  var plan = PLAN_RE_.test(text), done = DONE_RE_.test(text);
  var who = uniq_((text.match(ROLE_RE_) || []).concat(people.filter(function (n) { return text.indexOf(n) >= 0; })));
  return { kind: plan ? 'plan' : done ? 'done' : 'event', signal: plan || done || ((text.match(TIME_RE_) || []).length > 0 && ((text.match(PLACE_RE_) || []).length > 0 || who.length > 0)),
    people: who, places: uniq_(text.match(PLACE_RE_) || []), timeText: uniq_(text.match(TIME_RE_) || []) };
}

// ---------- TXT 해석 ----------
// Galaxy 녹음 앱 TXT는 UTF-16(BOM 포함)이다. BOM을 보고 판단하고, 없으면 UTF-8.
function decodeTxt_(blob) {
  var b = blob.getBytes(), h = function (i) { return (b[i] + 256) % 256; };
  if (b.length >= 2 && ((h(0) === 0xFE && h(1) === 0xFF) || (h(0) === 0xFF && h(1) === 0xFE)))
    return blob.getDataAsString('UTF-16').replace(/^﻿/, '');
  return blob.getDataAsString('UTF-8').replace(/^﻿/, '');
}
// "음성 261016_094322_original.txt" → 녹음 시작 2026-10-16 09:43:22(KST)
function nameTime_(name) {
  var m = /(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/.exec(name);
  if (!m) return null;
  var d = new Date('20' + m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] + '+09:00');
  return isNaN(d.getTime()) ? null : d.toISOString();
}
var SPEAKER_RE_ = /^\s*(\S{1,12}?)\s*(\d{1,2})?\s*\((?:(\d{1,2}):)?(\d{1,2}):(\d{2})\)\s*$/;
function splitSentences_(t) { return t.split(/(?<=[.?!。])\s+|\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 4; }); }
// TXT → 후보 블록. 정보 신호가 있는 문장만 고르고 나머지 대화는 버린다.
function candidates_(name, text) {
  var start = nameTime_(name), people = knownPeople_(), lines = text.replace(/\r\n?/g, '\n').split('\n');
  var segs = [], cur = null, intro = [], galaxy = false;
  lines.forEach(function (line) {
    var m = SPEAKER_RE_.exec(line);
    if (m) { galaxy = true; cur = { speaker: m[1] + (m[2] ? ' ' + m[2] : ''), offset: (+(m[3] || 0)) * 3600 + (+m[4]) * 60 + (+m[5]), text: '' }; segs.push(cur); return; }
    if (cur) cur.text += line + '\n';
    else if (line.trim() && !/^AI로 생성된 콘텐츠/.test(line.trim())) intro.push(line.trim());
  });
  if (!galaxy) { segs = text.split(/\n\s*\n/).map(function (p) { return { speaker: '', offset: null, text: p }; }); intro = []; }
  var out = [], total = 0;
  segs.forEach(function (s) {
    splitSentences_(s.text).forEach(function (sentence) {
      total++;
      var a = analyze_(sentence, people);
      if (!a.signal) return;
      var last = out[out.length - 1];
      // 같은 화자의 연속 신호 문장(2분 이내)은 한 블록으로 합친다.
      if (last && last.speaker === s.speaker && last.text.length < 400 && (s.offset === null || s.offset - last.offset <= 120)) {
        last.text += ' ' + sentence; last.people = uniq_(last.people.concat(a.people)); last.places = uniq_(last.places.concat(a.places));
        last.timeText = uniq_(last.timeText.concat(a.timeText)); if (a.kind === 'plan') last.kind = 'plan'; else if (a.kind === 'done' && last.kind === 'event') last.kind = 'done';
        last.sentences++; return;
      }
      out.push({ speaker: s.speaker, offset: s.offset, text: sentence, kind: a.kind, people: a.people, places: a.places, timeText: a.timeText, sentences: 1 });
    });
  });
  var picked = out.reduce(function (n, c) { return n + c.sentences; }, 0);
  var list = out.map(function (c, i) {
    return { idx: i, text: maskSensitive_(c.text).slice(0, 2000), kind: c.kind, speaker: c.speaker, people: c.people, places: c.places, timeText: c.timeText,
      offsetText: c.offset === null ? '' : Math.floor(c.offset / 60) + ':' + ('0' + c.offset % 60).slice(-2),
      occurredAt: start && c.offset !== null ? new Date(new Date(start).getTime() + c.offset * 1000).toISOString() : start,
      sourceType: 'imported_transcript', selected: true };
  });
  // 녹음 앱이 만든 요약(머리말)은 AI 생성물이므로 기본 선택 해제, 따로 표시
  if (intro.length) list.push({ idx: list.length, text: maskSensitive_(intro.join(' ')).slice(0, 2000), kind: 'summary', speaker: '', people: [], places: [], timeText: [],
    offsetText: '', occurredAt: start, sourceType: 'device_ai_summary', selected: false });
  return { startedAt: start, candidates: list, totalSentences: total, droppedSentences: total - picked };
}

// ---------- 승인형 TXT 수집 ----------
// SYSTEM/inbox.json: 파일별 상태(pending/imported/rejected/error)와 해시. 원문은 저장하지 않는다.
function registry_() { ensureFolder_('SYSTEM'); return read_('SYSTEM', 'inbox.json') || { files: {}, log: [] }; }
function saveRegistry_(r) { r.log = r.log.slice(-50); return write_('SYSTEM', 'inbox.json', r); }
function logInbox_(r, level, msg) { r.log.push({ at: now_(), level: level, msg: String(msg).slice(0, 300) }); }
// 신규·변경 TXT를 '승인 대기'로 등록만 한다. 트리거로 실행돼도 블록을 만들지 않는다.
function scanInbox_() {
  return lock_(function () {
    var p = props_(), reg = registry_(), token = p.getProperty('INBOX_CURSOR'), it;
    try { it = token ? DriveApp.continueFileIterator(token) : folder_('INBOX').getFiles(); }
    catch (e) { p.deleteProperty('INBOX_CURSOR'); it = folder_('INBOX').getFiles(); }
    var found = 0, changed = 0, errors = 0, scanned = 0;
    while (it.hasNext() && scanned < 30) {
      var f = it.next(), id = f.getId(), e = reg.files[id], updated = String(f.getLastUpdated().getTime()); scanned++;
      if (!/\.txt$/i.test(f.getName())) continue;
      if (e && e.updated === updated && (e.status !== 'error' || e.attempts >= 3)) continue; // 바뀌지 않은 파일은 다시 읽지 않음
      try {
        if (f.getSize() > 200000) throw new Error('파일이 너무 큽니다(200KB 초과). 나누어 올리세요.');
        var raw = decodeTxt_(f.getBlob());
        if (!raw.trim()) throw new Error('빈 파일');
        var hash = hex_(id + ':' + raw);
        if (!e) { reg.files[id] = { name: f.getName(), hash: hash, status: 'pending', updated: updated, detectedAt: now_(), attempts: 0 }; found++; }
        else if (e.hash !== hash) { e.prevStatus = e.status; e.hash = hash; e.status = 'pending'; e.name = f.getName(); e.updated = updated; e.attempts = 0; e.lastError = ''; changed++; }
        else { e.updated = updated; if (e.status === 'error') { e.status = 'pending'; e.lastError = ''; } }
      } catch (err) {
        errors++;
        var x = reg.files[id] || (reg.files[id] = { name: f.getName(), hash: '', status: 'error', updated: '', detectedAt: now_(), attempts: 0 });
        x.status = 'error'; x.attempts = (x.attempts || 0) + 1; x.lastError = err.message; x.updated = updated;
        logInbox_(reg, 'error', f.getName() + ': ' + err.message);
      }
    }
    if (it.hasNext()) p.setProperty('INBOX_CURSOR', it.getContinuationToken()); else p.deleteProperty('INBOX_CURSOR');
    if (found || changed) logInbox_(reg, 'info', '새 파일 ' + found + ' · 변경 ' + changed);
    saveRegistry_(reg);
    return { found: found, changed: changed, errors: errors, scanned: scanned, more: !!p.getProperty('INBOX_CURSOR') };
  });
}
function inboxList() {
  owner_(); var reg = registry_();
  return { files: Object.keys(reg.files).map(function (id) { var e = reg.files[id];
    return { fileId: id, name: e.name, status: e.status, detectedAt: e.detectedAt, attempts: e.attempts || 0, lastError: e.lastError || '', blocks: (e.blockIds || []).length }; })
    .sort(function (a, b) { return (b.detectedAt || '').localeCompare(a.detectedAt || ''); }), log: reg.log.slice(-10).reverse() };
}
function pendingFile_(fileId, hash) {
  var reg = registry_(), e = reg.files[id_(fileId)];
  if (!e || e.status !== 'pending') throw new Error('승인 대기 중인 파일이 아닙니다. 새로 확인하세요.');
  var f = DriveApp.getFileById(fileId), raw = decodeTxt_(f.getBlob());
  if (hex_(fileId + ':' + raw) !== e.hash || (hash && hash !== e.hash)) throw new Error('파일 내용이 바뀌었습니다. "새 TXT 확인"을 다시 누르세요.');
  return { reg: reg, entry: e, name: f.getName(), raw: raw };
}
// 후보 블록을 계산해서 보여주기만 한다(저장 안 함).
function previewInboxFile(fileId) {
  owner_(); var x = pendingFile_(fileId), c = candidates_(x.name, x.raw);
  return { fileId: fileId, name: x.name, hash: x.entry.hash, startedAt: c.startedAt, candidates: c.candidates,
    totalSentences: c.totalSentences, droppedSentences: c.droppedSentences, fileUrl: 'https://drive.google.com/file/d/' + fileId + '/view' };
}
// 사용자가 고른 후보만 블록으로 저장. edits로 문장을 고칠 수 있다.
function importInboxFile(input) {
  owner_();
  var selected = (input.selected || []).map(Number), edits = input.edits || {};
  return lock_(function () {
    var x = pendingFile_(input.fileId, input.hash), c = candidates_(x.name, x.raw), ids = [];
    c.candidates.forEach(function (cand) {
      if (selected.indexOf(cand.idx) < 0) return;
      var text = edits[cand.idx] !== undefined ? maskSensitive_(text_(String(edits[cand.idx]), 2000)) : cand.text;
      var b = addBlock_({ kind: cand.kind, text: text, speaker: cand.speaker, people: cand.people, places: cand.places, timeText: cand.timeText,
        occurredAt: cand.occurredAt, timeSource: cand.occurredAt ? 'recording' : null, sourceType: cand.sourceType,
        source: { type: 'txt', fileId: input.fileId, name: x.name, offset: cand.offsetText } }, input.fileId + ':' + x.entry.hash + ':' + cand.idx);
      ids.push(b.id);
    });
    x.entry.status = 'imported'; x.entry.blockIds = uniq_((x.entry.blockIds || []).concat(ids)); x.entry.decidedAt = now_();
    logInbox_(x.reg, 'info', x.name + ': 블록 ' + ids.length + '개 저장'); saveRegistry_(x.reg);
    return { saved: ids.length };
  });
}
function rejectInboxFile(input) {
  owner_();
  return lock_(function () {
    var reg = registry_(), e = reg.files[id_(input.fileId)];
    if (!e || e.status !== 'pending') throw new Error('승인 대기 중인 파일이 아닙니다.');
    e.status = 'rejected'; e.decidedAt = now_(); logInbox_(reg, 'info', e.name + ': 가져오지 않음'); saveRegistry_(reg);
    return { rejected: true };
  });
}

// ---------- 블록 조회·수정 ----------
function saveStatement(input) {
  owner_();
  var body = maskSensitive_(text_(input.text, 2000)), rid = id_(input.requestId), a = analyze_(body, knownPeople_());
  return lock_(function () {
    return addBlock_({ kind: a.kind === 'event' ? 'note' : a.kind, text: body, people: a.people, places: a.places, timeText: a.timeText,
      recordedAt: now_(), sourceType: 'self_statement', source: { type: 'chat' } }, 'chat:' + rid);
  });
}
function listBlocks(input) {
  owner_(); input = input || {};
  var q = typeof input.query === 'string' ? input.query.slice(0, 200) : '', date = /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') ? input.date : '';
  var page = Math.max(0, Math.floor(Number(input.page) || 0));
  var terms = keywords_(q), all = blocks_().filter(function (b) { return !b.deleted && (!date || kstDate_(blockTime_(b)) === date); })
    .filter(function (b) { return !terms.length || terms.some(function (t) { return (b.text || '').indexOf(t) >= 0; }); })
    .sort(function (a, b) { return blockTime_(b).localeCompare(blockTime_(a)); });
  return { total: all.length, page: page, items: all.slice(page * 20, page * 20 + 20) };
}
function correctBlock(input) {
  owner_(); var body = maskSensitive_(text_(input.text, 2000));
  return lock_(function () {
    var b = block_(input.id);
    if (b.revision !== input.revision) throw new Error('기록이 변경되었습니다. 새로 조회하세요.');
    b.history.push({ text: b.text, revision: b.revision, replacedAt: now_() });
    b.text = body; b.revision++; b.updatedAt = now_();
    return putBlock_(b);
  });
}
function setTaskStatus(input) {
  owner_();
  if (['open', 'done', 'dropped'].indexOf(input.status) < 0) throw new Error('상태를 선택하세요.');
  return lock_(function () {
    var b = block_(input.id);
    if (!b.task) throw new Error('할 일 블록이 아닙니다.');
    b.history.push({ task: b.task, revision: b.revision, replacedAt: now_() });
    b.task = { status: input.status, changedAt: now_(), by: 'user' }; b.revision++;
    return putBlock_(b);
  });
}
// 삭제: 내용·이력은 지우고 ID만 남긴다(같은 TXT 후보가 다시 저장되지 않도록).
function deleteBlock(id) {
  owner_();
  return lock_(function () { var b = block_(id); return putBlock_({ id: b.id, deleted: true, createdAt: b.createdAt, deletedAt: now_() }) && { deleted: true }; });
}
