function folder_(key) { return DriveApp.getFolderById(required_(key + '_FOLDER_ID')); }
function file_(key, name) {
  var it = folder_(key).getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}
function read_(key, name) {
  var f = file_(key, name);
  return f ? JSON.parse(f.getBlob().getDataAsString('UTF-8')) : null;
}
function write_(key, name, value) {
  var s = JSON.stringify(value), f = file_(key, name);
  if (f) f.setContent(s); else folder_(key).createFile(name, s, 'application/json');
  return value;
}
function record_(id) {
  var r = read_('RECORDS', id_(id) + '.json');
  if (!r) throw new Error('기록을 찾을 수 없습니다.');
  return r;
}
function records_() {
  var it = folder_('RECORDS').getFiles(), result = [];
  while (it.hasNext()) {
    var f = it.next();
    if (!/\.json$/.test(f.getName())) continue;
    if (result.length >= 1000) throw new Error('알파 저장소 한도 1000건입니다. 인덱스 DB로 이전하세요.');
    result.push(JSON.parse(f.getBlob().getDataAsString('UTF-8')));
  }
  return result;
}
function insert_(r) {
  var old = read_('RECORDS', id_(r.id) + '.json');
  if (old) return old;
  if (records_().length >= 1000) throw new Error('알파 저장소 한도 1000건');
  r.createdAt = now_(); r.revision = 1; r.history = [];
  return write_('RECORDS', r.id + '.json', r);
}
function search_(query) {
  var terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  return records_().filter(function (r) { return !r.deleted; }).map(function (r) {
    var hay = (r.text || '').toLowerCase();
    return { r: r, score: terms.reduce(function (s, t) { return s + (hay.indexOf(t) >= 0 ? 1 : 0); }, 0) };
  }).filter(function (x) { return !terms.length || x.score > 0; }).sort(function (a, b) {
    return b.score - a.score || b.r.createdAt.localeCompare(a.r.createdAt);
  }).map(function (x) { return x.r; });
}
function listRecords(query, page) {
  owner_();
  query = typeof query === 'string' ? query.slice(0, 300) : '';
  page = Math.max(0, Math.floor(Number(page) || 0));
  var all = search_(query);
  return { total: all.length, page: page, items: all.slice(page * 20, page * 20 + 20) };
}
function exportRecords() {
  owner_();
  return { exportedAt: now_(), format: 'external-memory-alpha-v2', blocks: blocks_().filter(function (b) { return !b.deleted; }),
    records: records_(), profile: read_('PROFILE', 'current.json') };
}
function deleteRecord(id) {
  owner_();
  return lock_(function () {
    var r = record_(id);
    // Tombstone prevents automatic TXT reimport; personal content/history is removed.
    var audio = r.audioFileId;
    if (audio) DriveApp.getFileById(audio).setTrashed(true);
    write_('RECORDS', r.id + '.json', { id: r.id, deleted: true, createdAt: r.createdAt, deletedAt: now_() });
    return { deleted: true };
  });
}
