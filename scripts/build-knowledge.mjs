// knowledge/ 의 원본 문서를 src/Knowledge.gs 하나로 묶는다. (GAS에는 src만 올라가므로)
// 사용: node scripts/build-knowledge.mjs   → 원본을 고친 뒤 clasp push 전에 실행
// 검사: node scripts/build-knowledge.mjs --check   → Knowledge.gs가 원본과 다르면 실패
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
// knowledge/README.md 의 '처음 읽을 순서'를 따른다. sources.json은 SOURCES.md와 내용이 같아 뺀다.
const ORDER = ['README.md', 'context/PROJECT_MEMORY_original.md', 'spec/ANTIGRAVITY_INSTRUCTIONS.md', 'references/SOURCES.md', 'references/RESEARCH_MAPPING.md'];
export function buildKnowledge() {
  const text = ORDER.map(p => '===== ' + p + '\n' + fs.readFileSync(new URL('knowledge/' + p, root), 'utf8').replace(/\r\n/g, '\n').trim()).join('\n\n');
  return '// 자동 생성 파일 — 직접 고치지 말고 knowledge/ 를 고친 뒤 node scripts/build-knowledge.mjs 실행\n' +
    '// 원본: ' + ORDER.join(', ') + '\n' +
    'var KNOWLEDGE_ = ' + JSON.stringify(text) + ';\n';
}
// 상담 캐릭터 설정(character/SOUL.md)도 같은 방식으로 src/Character.gs 하나로 묶는다.
export function buildCharacter() {
  const text = fs.readFileSync(new URL('character/SOUL.md', root), 'utf8').replace(/\r\n/g, '\n').trim();
  return '// 자동 생성 파일 — 직접 고치지 말고 character/SOUL.md 를 고친 뒤 node scripts/build-knowledge.mjs 실행\n' +
    'var CHARACTER_ = ' + JSON.stringify(text) + ';\n';
}
if (process.argv[1] && new URL('file:///' + process.argv[1].replace(/\\/g, '/')).href === import.meta.url) {
  for (const [name, out] of [['Knowledge.gs', buildKnowledge()], ['Character.gs', buildCharacter()]]) {
    const target = new URL('src/' + name, root);
    if (process.argv.includes('--check')) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== out) { console.error('src/' + name + '가 원본과 다릅니다. node scripts/build-knowledge.mjs 를 실행하세요.'); process.exit(1); }
      console.log(name + ' 최신 상태');
    } else {
      fs.writeFileSync(target, out);
      console.log('src/' + name + ' 생성 (' + out.length + '자)');
    }
  }
}
