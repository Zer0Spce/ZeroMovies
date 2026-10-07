'use strict';
// Numbered palettes follow Digital Synopsis's 39-palette collection. Backgrounds
// are darkened and text tones adjusted to preserve contrast for TV viewing.
const themes={
 dark:{name:'Default',bg:'#090a10',surface:'#161c29',sidebar:'#0d1019',card:'#1b2231',button:'#202a3b',focus:'#65e6cc',accent:'#65e6cc',selected:'#183d38',ink:'#f4f6fc',muted:'#b0bbcc',highlight:'#f6cc75',dialog:'#151c2a'},
 light:{name:'Light',bg:'#f3f5f9',surface:'#ffffff',sidebar:'#e8edf4',card:'#ffffff',button:'#e5ecef',focus:'#0a715e',accent:'#0a715e',selected:'#d4ebe5',ink:'#182130',muted:'#536174',highlight:'#755309',dialog:'#ffffff'},
 ocean:{name:'Palette 10 · Blue & Green',bg:'#081b29',surface:'#102c3d',sidebar:'#0c2333',card:'#153547',button:'#1a4155',focus:'#79e2bd',accent:'#79e2bd',selected:'#1c4c49',ink:'#effbff',muted:'#afcad7',highlight:'#bfe9c8',dialog:'#102c3d'},
 orchid:{name:'Palette 4 · Blue, Purple & Pink',bg:'#18132b',surface:'#29203d',sidebar:'#20182f',card:'#352748',button:'#453257',focus:'#efb3dc',accent:'#efb3dc',selected:'#573b60',ink:'#fff5fd',muted:'#cbbbda',highlight:'#adc2ff',dialog:'#29203d'},
 sunset:{name:'Palette 5 · Blue, Yellow & Orange',bg:'#101b2d',surface:'#1b2d45',sidebar:'#15233a',card:'#253953',button:'#324860',focus:'#ffc478',accent:'#ffc478',selected:'#5a4230',ink:'#fff8eb',muted:'#bac9da',highlight:'#f9dc8e',dialog:'#1b2d45'},
 midnight:{name:'Midnight Blue',bg:'#080b1a',surface:'#111936',sidebar:'#0b1228',card:'#172143',button:'#202d54',focus:'#7c9cff',accent:'#7c9cff',selected:'#263a70',ink:'#f7f8ff',muted:'#a8b2d8',highlight:'#a9bcff',dialog:'#111936'},
 ember:{name:'Ember Glow',bg:'#160d0b',surface:'#2b1712',sidebar:'#21100d',card:'#351d16',button:'#47251b',focus:'#ff7a59',accent:'#ff7a59',selected:'#613024',ink:'#fff5ef',muted:'#d7b2a4',highlight:'#ffbe8e',dialog:'#2b1712'},
 forest:{name:'Forest Moss',bg:'#09130f',surface:'#12251c',sidebar:'#0d1c15',card:'#173023',button:'#1f4030',focus:'#74d99f',accent:'#74d99f',selected:'#204833',ink:'#f0fff6',muted:'#a6c6b4',highlight:'#c7e98a',dialog:'#12251c'},
 rose:{name:'Rose Noir',bg:'#180d16',surface:'#30192b',sidebar:'#241020',card:'#3a1d34',button:'#4c2843',focus:'#ff8cc6',accent:'#ff8cc6',selected:'#633551',ink:'#fff4fa',muted:'#d8b2ca',highlight:'#ffb6da',dialog:'#30192b'},
 amethyst:{name:'Amethyst',bg:'#100c1c',surface:'#211833',sidebar:'#181127',card:'#2a1f40',button:'#392953',focus:'#b79cff',accent:'#b79cff',selected:'#4a3970',ink:'#faf7ff',muted:'#c6b7da',highlight:'#e1c6ff',dialog:'#211833'},
 cyber:{name:'Cyber Mint',bg:'#071315',surface:'#0e292d',sidebar:'#091f22',card:'#12343a',button:'#17464c',focus:'#32e6d3',accent:'#32e6d3',selected:'#104944',ink:'#efffff',muted:'#9bc5c7',highlight:'#8dfff2',dialog:'#0e292d'},
 cobalt:{name:'Cobalt Sky',bg:'#08111f',surface:'#10223c',sidebar:'#0b192e',card:'#152c4d',button:'#1d3a62',focus:'#4da3ff',accent:'#4da3ff',selected:'#234c7a',ink:'#f4f8ff',muted:'#afc4e0',highlight:'#8fc9ff',dialog:'#10223c'},
 gold:{name:'Golden Hour',bg:'#151108',surface:'#2a2110',sidebar:'#20190b',card:'#352a14',button:'#46371b',focus:'#f7c948',accent:'#f7c948',selected:'#5b4720',ink:'#fff8e8',muted:'#d7c49a',highlight:'#ffe08a',dialog:'#2a2110'},
 coral:{name:'Coral Night',bg:'#170f12',surface:'#2f1b20',sidebar:'#231417',card:'#3a2228',button:'#4b2c33',focus:'#ff7f8e',accent:'#ff7f8e',selected:'#633740',ink:'#fff5f7',muted:'#ddb7bf',highlight:'#ffb0b8',dialog:'#2f1b20'},
 aurora:{name:'Aurora',bg:'#081315',surface:'#10272b',sidebar:'#0b1d20',card:'#153238',button:'#1b4249',focus:'#8ef0c7',accent:'#8ef0c7',selected:'#24584f',ink:'#f0ffff',muted:'#a7c9c7',highlight:'#9cc8ff',dialog:'#10272b'},
 slate:{name:'Slate Ice',bg:'#0c1116',surface:'#17212b',sidebar:'#111820',card:'#1d2a36',button:'#273846',focus:'#8cc8ff',accent:'#8cc8ff',selected:'#283e50',ink:'#f4f7fa',muted:'#aab8c4',highlight:'#b7ddff',dialog:'#17212b'},
 mocha:{name:'Mocha',bg:'#15100d',surface:'#2b211b',sidebar:'#201813',card:'#372a22',button:'#49372c',focus:'#d9a273',accent:'#d9a273',selected:'#5b4535',ink:'#fff8f0',muted:'#d3c0b0',highlight:'#f0c69e',dialog:'#2b211b'}
};
module.exports={themes};
