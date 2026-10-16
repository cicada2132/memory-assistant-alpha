function uploadAudio(input) {
  owner_(); var rid = id_(input.requestId);
  var allowed = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/webm': 'webm' };
  if (!allowed[input.mimeType]) throw new Error('mp3/m4a/wav/webm 파일을 사용하세요.');
  if (typeof input.base64 !== 'string' || input.base64.length > 11200000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)) throw new Error('최대 8 MiB 파일을 올리세요.');
  var bytes = Utilities.base64Decode(input.base64);
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error('최대 8 MiB 파일을 올리세요.');
  return lock_(function () {
    var old = read_('RECORDS', rid + '.json');
    if (old) return old;
    if (records_().length >= 1000) throw new Error('알파 저장소 한도 1000건');
    var f = folder_('AUDIO').createFile(Utilities.newBlob(bytes, input.mimeType, rid + '.' + allowed[input.mimeType]));
    try { return insert_({ id: rid, text: '', sourceType: 'audio_transcript', source: String(input.name || '녹음').slice(0, 200), audioFileId: f.getId(), occurredAt: null, transcriptionStatus: 'pending', analysis: null }); }
    catch (e) { f.setTrashed(true); throw e; }
  });
}
function transcribeAudio(input) {
  owner_(); consent_(input.consent);
  var r = record_(input.id), rev = r.revision;
  if (r.deleted || !r.audioFileId) throw new Error('녹음 기록이 없습니다.');
  if (r.transcriptionStatus === 'completed') return r;
  var blob = DriveApp.getFileById(r.audioFileId).getBlob();
  var mime = { 'audio/mpeg': 'audio/mp3', 'audio/x-wav': 'audio/wav', 'audio/x-m4a': 'audio/mp4' }[blob.getContentType()] || blob.getContentType();
  var result = gemini_({ contents: [{ role: 'user', parts: [
    { text: '이 한국어 녹음을 들리는 그대로 받아 적어라. 설명·요약·제목 없이 전사문만 출력하라. 알아들을 수 없는 부분은 [불명확]으로 적어라.' },
    { inlineData: { mimeType: mime, data: Utilities.base64Encode(blob.getBytes()) } }] }],
    generationConfig: { maxOutputTokens: 8192 } });
  var transcript = text_(responseText_(result), 30000);
  if (!transcript) throw new Error('전사 결과가 비어 있습니다.');
  return lock_(function () {
    var latest = record_(input.id);
    if (latest.deleted || latest.revision !== rev) throw new Error('기록이 변경되었습니다. 다시 조회하세요.');
    latest.text = transcript; latest.transcriptionStatus = 'completed'; latest.transcribedAt = now_(); latest.revision++;
    return write_('RECORDS', latest.id + '.json', latest);
  });
}
function transcribeAndAnalyze(input) {
  owner_(); consent_(input.consent);
  var r = transcribeAudio({ id: input.id, consent: true });
  // Explicit pipeline consent covers raw audio and this bounded transcript excerpt.
  return analyzeRecord({ id: r.id, consent: true, preview: r.text.slice(0, 12000) });
}
