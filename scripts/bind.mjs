import fs from 'node:fs';
import path from 'node:path';
const id=process.argv[2];
if(!id||! /^[a-zA-Z0-9_-]{20,160}$/.test(id)||id.startsWith('AKfy'))throw Error('Apps Script의 프로젝트 설정에서 Script ID를 입력하세요. /exec 배포 ID는 사용할 수 없습니다.');
const target=path.resolve('.clasp.json');
if(fs.existsSync(target)){const old=JSON.parse(fs.readFileSync(target,'utf8'));if(old.scriptId!==id)throw Error('다른 프로젝트 연결이 존재합니다. 연결 파일을 덮어쓰지 않았습니다.');}
fs.writeFileSync(target,JSON.stringify({scriptId:id,rootDir:'src'},null,2)+'\n');
console.log('연결 설정 완료. clasp open-script로 프로젝트 이름을 확인하세요.');
