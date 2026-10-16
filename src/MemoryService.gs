function saveText(input) {
  owner_();
  var body = text_(input.text, 30000), rid = id_(input.requestId);
  return lock_(function () { return insert_({ id: rid, text: body, sourceType: 'self_statement', source: 'chat', occurredAt: null, analysis: null }); });
}
function correctRecord(input) {
  owner_(); var body = text_(input.text, 30000);
  return lock_(function () {
    var r = record_(input.id);
    if (r.deleted) throw new Error('삭제된 기록');
    if (r.revision !== input.revision) throw new Error('기록이 변경되었습니다. 새로 조회하세요.');
    r.history.push({ text: r.text, analysis: r.analysis || null, revision: r.revision, replacedAt: now_() });
    r.text = body; r.analysis = null; r.revision++; r.updatedAt = now_();
    return write_('RECORDS', r.id + '.json', r);
  });
}
// 2026-10-16 변경: TXT 원문 전체를 기록으로 저장하지 않는다. 새 파일을 '승인 대기'로 등록만 하고,
// 사용자가 화면에서 고른 블록만 저장한다(Blocks.gs scanInbox_/importInboxFile).
function syncInbox() { owner_(); return scanInbox_(); }
// Trigger handlers and editor-run helpers must be public (no trailing _).
function inboxTrigger() { return scanInbox_(); }
function enableInboxSync() {
  owner_();
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'inboxTrigger'; }))
    ScriptApp.newTrigger('inboxTrigger').timeBased().everyMinutes(5).create();
}
function disableInboxSync() {
  owner_(); ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'inboxTrigger') ScriptApp.deleteTrigger(t);
  });
}
function getProfile() { owner_(); return read_('PROFILE', 'current.json') || { revision: 0, values: {}, history: [], proposals: [] }; }
function proposeProfile(input) {
  owner_();
  var key = text_(input.key, 80), value = text_(input.value, 2000), evidence = text_(input.evidence, 1000);
  return lock_(function () {
    var p = getProfile();
    if (p.proposals.filter(function (x) { return x.status === 'pending'; }).length >= 50) throw new Error('보류 중인 제안을 먼저 처리하세요.');
    p.proposals.push({ id: Utilities.getUuid(), key: key, oldValue: p.values[key] || '', value: value, evidence: evidence,
      baseRevision: p.revision, status: 'pending', createdAt: now_() });
    return write_('PROFILE', 'current.json', p);
  });
}
function decideProfile(input) {
  owner_();
  if (['approve', 'reject'].indexOf(input.action) < 0) throw new Error('승인 또는 거절을 선택하세요.');
  return lock_(function () {
    var p = getProfile(), item = p.proposals.filter(function (x) { return x.id === input.id; })[0];
    if (!item || item.status !== 'pending') throw new Error('처리 가능한 제안이 없습니다.');
    if (input.action === 'approve') {
      if (p.revision !== item.baseRevision) throw new Error('자기정보가 변경되었습니다. 새 제안으로 다시 확인하세요.');
      var value = input.editedValue === undefined ? item.value : text_(input.editedValue, 2000);
      p.history.push({ revision: p.revision, values: JSON.parse(JSON.stringify(p.values)), changedAt: now_(), proposalId: item.id });
      p.values[item.key] = value; p.revision++;
    }
    item.status = input.action === 'approve' ? 'approved' : 'rejected'; item.decidedAt = now_();
    return write_('PROFILE', 'current.json', p);
  });
}
