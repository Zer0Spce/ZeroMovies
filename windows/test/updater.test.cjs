const test=require('node:test'),assert=require('node:assert/strict');
const {newer,cleanVersion,testRelease}=require('../updater.cjs');
test('update version comparison handles tags and patch versions',()=>{assert.deepEqual(cleanVersion('v2.0.1'),[2,0,1]);assert.equal(newer('2.0','1.9.0'),true);assert.equal(newer('1.9','1.9.0'),false);assert.equal(newer('1.9.1','1.9.0'),true);assert.equal(newer('1.8.9','1.9.0'),false);});
test('updater ignores demo releases',()=>{assert.equal(testRelease({tag_name:'v9.9.9-TEST'}),true);assert.equal(testRelease({tag_name:'v2.0-DEMO'}),true);assert.equal(testRelease({tag_name:'v2.0-placeholder'}),true);assert.equal(testRelease({tag_name:'v2.0'}),false);});
