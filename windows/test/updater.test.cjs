const test=require('node:test'),assert=require('node:assert/strict');
const {newer,cleanVersion}=require('../updater.cjs');
test('update version comparison handles tags and patch versions',()=>{assert.deepEqual(cleanVersion('v2.0.1'),[2,0,1]);assert.equal(newer('2.0','1.9.0'),true);assert.equal(newer('1.9','1.9.0'),false);assert.equal(newer('1.9.1','1.9.0'),true);assert.equal(newer('1.8.9','1.9.0'),false);});
