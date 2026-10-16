function props_() { return PropertiesService.getScriptProperties(); }
function required_(name) {
  var v = props_().getProperty(name);
  if (!v) throw new Error('설정 필요: ' + name);
  return v;
}
function owner_() {
  var expected = required_('OWNER_EMAIL').toLowerCase();
  var actual = Session.getActiveUser().getEmail().toLowerCase();
  if (!actual || actual !== expected) throw new Error('본인 계정으로 로그인해야 합니다.');
}
function lock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function text_(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error('입력 길이를 확인하세요. 최대 ' + max + '자');
  return value.trim();
}
function id_(v) {
  if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(v)) throw new Error('잘못된 ID');
  return v;
}
function now_() { return new Date().toISOString(); }
// Run from the Apps Script editor (names ending in _ are hidden from the Run menu).
// The web app is MYSELF-only, so no other account can reach this via google.script.run.
function setup() {
  return lock_(function () {
    var p = props_(), email = Session.getEffectiveUser().getEmail();
    if (!email) throw new Error('소유자 이메일 확인 불가');
    if (p.getProperty('OWNER_EMAIL') && p.getProperty('OWNER_EMAIL') !== email)
      throw new Error('기존 소유자 설정을 확인하세요.');
    p.setProperty('OWNER_EMAIL', email);
    if (!p.getProperty('ROOT_FOLDER_ID')) p.setProperty('ROOT_FOLDER_ID', DriveApp.createFolder('External Memory Alpha').getId());
    var root = DriveApp.getFolderById(required_('ROOT_FOLDER_ID'));
    ['RECORDS', 'AUDIO', 'INBOX', 'PROFILE'].forEach(function (key) {
      if (!p.getProperty(key + '_FOLDER_ID')) p.setProperty(key + '_FOLDER_ID', root.createFolder(key).getId());
    });
    if (!p.getProperty('GEMINI_MODEL')) p.setProperty('GEMINI_MODEL', 'gemini-2.5-flash');
    return { ready: true }; // Never log all Script Properties.
  });
}
function doGet() {
  owner_();
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('개인 기록 실험실 α');
}
function getStatus() {
  owner_();
  var reg = registry_(), pending = Object.keys(reg.files).filter(function (k) { return reg.files[k].status === 'pending'; }).length;
  return { ready: true, aiConfigured: !!props_().getProperty('GEMINI_API_KEY'), aiEnabled: aiEnabled_() && !!props_().getProperty('GEMINI_API_KEY'),
    inboxPending: pending, today: kstDate_(now_()),
    inboxUrl: 'https://drive.google.com/drive/folders/' + required_('INBOX_FOLDER_ID'),
    triggerEnabled: ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'inboxTrigger'; }) };
}
