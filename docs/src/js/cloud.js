var a0_0x3e472d=a0_0x26bd;function a0_0x26bd(_0x3623c2,_0x507372){var _0x78cef7=a0_0x78ce();return a0_0x26bd=function(_0x26bd20,_0x93b1f5){_0x26bd20=_0x26bd20-0x144;var _0x3f5d3b=_0x78cef7[_0x26bd20];return _0x3f5d3b;},a0_0x26bd(_0x3623c2,_0x507372);}(function(_0x1cf22e,_0xb8be8a){var _0x4b45f7=a0_0x26bd,_0x5f4596=_0x1cf22e();while(!![]){try{var _0x35ecbd=-parseInt(_0x4b45f7(0x144))/0x1+parseInt(_0x4b45f7(0x146))/0x2*(parseInt(_0x4b45f7(0x160))/0x3)+-parseInt(_0x4b45f7(0x14e))/0x4*(-parseInt(_0x4b45f7(0x180))/0x5)+parseInt(_0x4b45f7(0x173))/0x6+parseInt(_0x4b45f7(0x15a))/0x7*(parseInt(_0x4b45f7(0x16a))/0x8)+parseInt(_0x4b45f7(0x197))/0x9*(parseInt(_0x4b45f7(0x18a))/0xa)+-parseInt(_0x4b45f7(0x16f))/0xb*(parseInt(_0x4b45f7(0x17f))/0xc);if(_0x35ecbd===_0xb8be8a)break;else _0x5f4596['push'](_0x5f4596['shift']());}catch(_0x4f8714){_0x5f4596['push'](_0x5f4596['shift']());}}}(a0_0x78ce,0xe86e8));import*as a0_0x4590ce from'./main.js';import{localStorageFile}from'./storage.js';var clientId=a0_0x3e472d(0x156),clientSecret=a0_0x3e472d(0x145);function authorizeWithDropbox(){var _0x2cee66=a0_0x3e472d,_0x5c5248=window['location'][_0x2cee66(0x16b)][_0x2cee66(0x1b2)]('?')[0x0],_0x2b4e46='code',_0x5b8575=_0x2cee66(0x175),_0x309557=_0x2cee66(0x15d)+clientId+'&response_type='+_0x2b4e46+_0x2cee66(0x174)+_0x5b8575+'&redirect_uri='+encodeURIComponent(_0x5c5248);window[_0x2cee66(0x18c)][_0x2cee66(0x16b)]=_0x309557;}function handleDropboxCallback(){var _0x280558=a0_0x3e472d,_0x59d10b=getUrlParameter(_0x280558(0x1a2));_0x59d10b?(getAccessToken(_0x59d10b),console[_0x280558(0x150)](_0x280558(0x183),_0x59d10b)):console['log'](_0x280558(0x188));}function getUrlParameter(_0x286bf5){var _0x516745=a0_0x3e472d;_0x286bf5=_0x286bf5[_0x516745(0x19b)](/[\[]/,'\x5c[')[_0x516745(0x19b)](/[\]]/,'\x5c]');var _0x33786e=new RegExp(_0x516745(0x171)+_0x286bf5+_0x516745(0x194)),_0x5a6c00=_0x33786e['exec'](location[_0x516745(0x1a7)]);return _0x5a6c00===null?'':decodeURIComponent(_0x5a6c00[0x1][_0x516745(0x19b)](/\+/g,'\x20'));}function getAccessToken(_0x463fcf){var _0x2aa36e=a0_0x3e472d,_0x329403='authorization_code',_0xa9ba=window['location'][_0x2aa36e(0x16b)][_0x2aa36e(0x1b2)]('?')[0x0],_0x2e1220=new XMLHttpRequest();_0x2e1220[_0x2aa36e(0x18f)](_0x2aa36e(0x147),_0x2aa36e(0x15e)),_0x2e1220[_0x2aa36e(0x1af)]('Content-Type','application/x-www-form-urlencoded'),_0x2e1220[_0x2aa36e(0x149)]=function(){var _0x5738f8=_0x2aa36e;if(_0x2e1220[_0x5738f8(0x18b)]===0xc8){var _0x214f93=JSON[_0x5738f8(0x14d)](_0x2e1220[_0x5738f8(0x153)]),_0x3b46a9=_0x214f93[_0x5738f8(0x1a4)],_0x22179c=_0x214f93[_0x5738f8(0x1a3)],_0x345bfa=_0x214f93[_0x5738f8(0x190)];localStorage[_0x5738f8(0x167)](_0x5738f8(0x182),_0x3b46a9),localStorage[_0x5738f8(0x167)]('refreshToken',_0x22179c),localStorage[_0x5738f8(0x167)](_0x5738f8(0x1b0),_0x345bfa);}else console[_0x5738f8(0x150)](_0x5738f8(0x14a));},_0x2e1220['send'](_0x2aa36e(0x16e)+_0x463fcf+_0x2aa36e(0x186)+_0x329403+_0x2aa36e(0x1ac)+clientId+_0x2aa36e(0x196)+clientSecret+_0x2aa36e(0x154)+encodeURIComponent(_0xa9ba));}export async function dpRefreshToken(){var _0x5c8d99=a0_0x3e472d;if(!localStorage[_0x5c8d99(0x19d)]('refreshToken'))throw'No\x20refresh\x20token';try{const _0x2ef05b=await fetch('https://api.dropboxapi.com/oauth2/token',{'method':_0x5c8d99(0x147),'headers':{'Content-Type':_0x5c8d99(0x17d)},'body':_0x5c8d99(0x155)+localStorage[_0x5c8d99(0x19d)]('refreshToken')+'&grant_type=refresh_token&client_id=knh3uz2mx2hp2eu&client_secret=nwb3dnfh09rhs31'}),_0x80083f=await _0x2ef05b[_0x5c8d99(0x177)]();if(!_0x80083f['error'])return localStorage['setItem'](_0x5c8d99(0x182),_0x80083f[_0x5c8d99(0x1a4)]),await lockNoti('','Refreshing\x20token...',0xbb8),await delay(0x3e8),!![];else alert(_0x80083f['error_description']||_0x5c8d99(0x169));}catch(_0x4411aa){console[_0x5c8d99(0x199)]('Error\x20while\x20refreshing\x20token:',_0x4411aa);}return![];}function a0_0x78ce(){var _0x5d0fce=['=([^&#]*)','remove','&client_secret=','63PFpMbV','uploadSaveOrSaveState','error','alert','replace','state','getItem','FSSync','list','entries','Do\x20you\x20want\x20to\x20logout?','code','refresh_token','access_token','text/plain','lastIndexOf','search','Cloud\x20login\x20required!','Failed\x20to\x20upload\x20file\x20','click','.ss7','&client_id=','Download\x20failed,\x20unknown\x20http\x20status:\x20','.ss0','setRequestHeader','uId','https://content.dropboxapi.com/2/files/download','split','name','.ss2','save','1149483fIMVUp','nwb3dnfh09rhs31','194kTKcZK','POST','application/octet-stream','onload','Do\x20not\x20receive\x20access\x20token\x20&\x20refresh\x20token','Restore\x20canceled\x20by\x20user.','length','parse','4963064PpgxLc','Restoring...','log','stringify','\x20files\x20in\x20Cloud?','responseText','&redirect_uri=','refresh_token=','knh3uz2mx2hp2eu','Download\x20failed,\x20unknown\x20http\x20status:','https://content.dropboxapi.com/2/files/upload','gba','2179303VlHVAS','charAt','addEventListener','https://www.dropbox.com/oauth2/authorize?client_id=','https://api.dropbox.com/oauth2/token','DOMContentLoaded','33795WtbTCg','application/json','.ss1','file','downloadFileInCloud','.ss3','Bearer\x20','setItem','.gba_slot','Failed\x20to\x20refresh\x20Dropbox\x20token.','48IxKlba','href','Upload\x20failed,\x20unknown\x20http\x20status:\x20','active','code=','2223815ThlgSh','text','[\x5c?&#]','confirm','2402712nBaiYW','&token_access_type=','offline','.txt','json','endsWith','filter','Kabu\x20storage\x20↦\x20Cloud\x20◆','substring','.gba_imageState','application/x-www-form-urlencoded','.ss6','156IJOmeq','5aPUvCg','overwrite','accessToken','Authorization\x20Code:','.tag','status:\x20','&grant_type=','slice','Do\x20not\x20receive\x20authorization','_imageState','182530YKoHOq','status','location','toUpperCase','classList','open','uid','_dateState','Unable\x20to\x20refresh\x20token','Cloud\x20↦\x20Kabu\x20storage\x20◆'];a0_0x78ce=function(){return _0x5d0fce;};return a0_0x78ce();}export async function dpUploadFile(_0xbd2752,_0x17b95c){var _0x1aab8f=a0_0x3e472d;const _0x5a38b2=localStorage[_0x1aab8f(0x19d)]('uId');var _0x27e713=JSON['stringify']({'autorename':!![],'mode':_0x1aab8f(0x181),'mute':!![],'strict_conflict':![],'path':'/'+_0x5a38b2+'/'+_0xbd2752}),_0x5b77e7=new Blob([_0x17b95c],{'type':_0x1aab8f(0x148)});for(var _0xcbb5d3=0x0;_0xcbb5d3<0x2;_0xcbb5d3++){var _0x594989=await fetch(_0x1aab8f(0x158),{'method':_0x1aab8f(0x147),'headers':{'Authorization':_0x1aab8f(0x166)+localStorage[_0x1aab8f(0x19d)](_0x1aab8f(0x182)),'Dropbox-API-Arg':_0x27e713,'Content-Type':_0x1aab8f(0x148)},'body':_0x5b77e7});if(_0x594989['status']!=0xc8){if(_0x594989['status']==0x191){var _0x3f3cdf=await dpRefreshToken();if(!_0x3f3cdf)throw _0x1aab8f(0x192);continue;}else throw _0x1aab8f(0x16c)+_0x594989[_0x1aab8f(0x18b)];}else{var _0x420bf5=await _0x594989[_0x1aab8f(0x177)]();return console[_0x1aab8f(0x150)](_0x1aab8f(0x17a),_0xbd2752),_0x420bf5;}}return![];}async function dpDownloadFile(_0x247a80){var _0x50d497=a0_0x3e472d;const _0x2c4d00=localStorage[_0x50d497(0x19d)](_0x50d497(0x1b0));var _0xa461b1=JSON[_0x50d497(0x151)]({'path':'/'+_0x2c4d00+'/'+_0x247a80});for(var _0x2b9005=0x0;_0x2b9005<0x2;_0x2b9005++){var _0x214f8a=await fetch(_0x50d497(0x1b1),{'method':_0x50d497(0x147),'headers':{'Authorization':_0x50d497(0x166)+localStorage[_0x50d497(0x19d)](_0x50d497(0x182)),'Dropbox-API-Arg':_0xa461b1}});if(_0x214f8a[_0x50d497(0x18b)]!=0xc8){if(_0x214f8a[_0x50d497(0x18b)]==0x191){var _0x31a501=await dpRefreshToken();if(!_0x31a501)throw _0x50d497(0x192);continue;}else throw _0x50d497(0x157)+_0x214f8a[_0x50d497(0x18b)];}const _0x13a01e=new File([await _0x214f8a['blob']()],_0x247a80);console[_0x50d497(0x150)](_0x50d497(0x193),_0x13a01e[_0x50d497(0x1b3)]);if(_0x247a80[_0x50d497(0x178)](_0x50d497(0x176))){const _0x4fa240=await _0x13a01e[_0x50d497(0x170)](),[_0x2f8248,_0x3d1e62]=_0x4fa240[_0x50d497(0x1b2)]('\x0a\x0a'),_0x1dc7f8=_0x247a80[_0x50d497(0x17b)](0x0,_0x247a80[_0x50d497(0x1a6)](_0x50d497(0x159))+0x3),_0xf0e730=_0x247a80[_0x50d497(0x15b)](_0x247a80[_0x50d497(0x14c)]-0x5);localStorage[_0x50d497(0x167)](_0x1dc7f8+_0x50d497(0x191)+_0xf0e730,_0x3d1e62),localStorage[_0x50d497(0x167)](_0x1dc7f8+_0x50d497(0x189)+_0xf0e730,_0x2f8248);}else a0_0x4590ce[_0x50d497(0x198)](_0x13a01e,()=>{var _0x1ea483=_0x50d497;localStorageFile(),Module[_0x1ea483(0x19e)]();});return _0x13a01e;}return![];}document[a0_0x3e472d(0x15c)](a0_0x3e472d(0x15f),function(){var _0x47acd0=a0_0x3e472d;dropboxRestore[_0x47acd0(0x15c)](_0x47acd0(0x1aa),async function(){var _0x25d575=_0x47acd0;const _0x55e1af=localStorage[_0x25d575(0x19d)](_0x25d575(0x1b0));if(_0x55e1af===null||_0x55e1af==='')window[_0x25d575(0x19a)](_0x25d575(0x1a8));else{var _0x85d197={'path':'/'+_0x55e1af};for(var _0x3054ba=0x0;_0x3054ba<0x2;_0x3054ba++){var _0x59c62f=await fetch('https://api.dropboxapi.com/2/files/list_folder',{'method':_0x25d575(0x147),'headers':{'Authorization':'Bearer\x20'+localStorage[_0x25d575(0x19d)](_0x25d575(0x182)),'Content-Type':_0x25d575(0x161)},'body':JSON[_0x25d575(0x151)](_0x85d197)});console[_0x25d575(0x150)](_0x25d575(0x185),_0x59c62f[_0x25d575(0x18b)]);if(_0x59c62f[_0x25d575(0x18b)]!=0xc8){if(_0x59c62f[_0x25d575(0x18b)]==0x191){var _0x5ce7a8=await dpRefreshToken();if(!_0x5ce7a8)throw _0x25d575(0x192);continue;}else throw _0x25d575(0x1ad)+_0x59c62f[_0x25d575(0x18b)];}else{const _0x29854f=await _0x59c62f[_0x25d575(0x177)](),_0x2a0daa=_0x29854f[_0x25d575(0x1a0)][_0x25d575(0x179)](_0x418508=>_0x418508[_0x25d575(0x184)]==='file')['length'],_0x129bae='Do\x20you\x20want\x20to\x20restore\x20'+_0x2a0daa+_0x25d575(0x152);if(window[_0x25d575(0x172)](_0x129bae))for(const _0xa09ea3 of _0x29854f[_0x25d575(0x1a0)]){_0xa09ea3['.tag']===_0x25d575(0x163)&&(await lockNoti(_0x25d575(0x14f),_0xa09ea3[_0x25d575(0x1b3)],0xbb8),await dpDownloadFile(_0xa09ea3['name']));}else console[_0x25d575(0x150)](_0x25d575(0x14b));return!![];}}return![];}}),dropboxBackup['addEventListener'](_0x47acd0(0x1aa),async function(){var _0x561692=_0x47acd0;const _0xfd1fbd=localStorage[_0x561692(0x19d)](_0x561692(0x1b0));if(_0xfd1fbd===null||_0xfd1fbd==='')window['alert'](_0x561692(0x1a8));else{const _0x6421fa=[_0x561692(0x19c),_0x561692(0x1b5)];let _0x405b8f=0x0;for(const _0x54d8d4 of _0x6421fa){const _0x71d1c8=a0_0x4590ce[_0x561692(0x19f)+(_0x54d8d4[_0x561692(0x15b)](0x0)[_0x561692(0x18d)]()+_0x54d8d4[_0x561692(0x187)](0x1))]();_0x405b8f+=_0x71d1c8[_0x561692(0x14c)];}if(window['confirm']('Do\x20you\x20want\x20to\x20backup\x20'+_0x405b8f+'\x20files\x20in\x20Kabu?'))for(const _0x8f5fab of _0x6421fa){const _0x9e20=a0_0x4590ce[_0x561692(0x19f)+(_0x8f5fab[_0x561692(0x15b)](0x0)[_0x561692(0x18d)]()+_0x8f5fab[_0x561692(0x187)](0x1))]();for(const _0x575524 of _0x9e20){const _0x4f4ead=await a0_0x4590ce[_0x561692(0x164)]('/data/'+_0x8f5fab+'s/'+_0x575524);try{await lockNoti('Backing\x20up...',_0x575524,0xbb8),await dpUploadFile(_0x575524,_0x4f4ead);if(_0x575524[_0x561692(0x178)](_0x561692(0x1ae))||_0x575524[_0x561692(0x178)](_0x561692(0x162))||_0x575524[_0x561692(0x178)](_0x561692(0x1b4))||_0x575524['endsWith'](_0x561692(0x165))||_0x575524[_0x561692(0x178)]('.ss4')||_0x575524['endsWith']('.ss5')||_0x575524['endsWith'](_0x561692(0x17e))||_0x575524[_0x561692(0x178)](_0x561692(0x1ab))){const _0x57dcb0=_0x575524[_0x561692(0x17b)](0x0,_0x575524['lastIndexOf']('.')),_0x38df88=_0x575524[_0x561692(0x15b)](_0x575524[_0x561692(0x14c)]-0x1),_0x88b21=localStorage[_0x561692(0x19d)](_0x57dcb0+_0x561692(0x17c)+_0x38df88),_0x54db72=localStorage[_0x561692(0x19d)](_0x57dcb0+'.gba_dateState'+_0x38df88);if(_0x88b21!==null){const _0x534837=_0x88b21+'\x0a\x0a'+_0x54db72,_0x56db4c=new Blob([_0x534837],{'type':_0x561692(0x1a5)});await lockNoti('Backing\x20up...',_0x57dcb0+_0x561692(0x168)+_0x38df88+_0x561692(0x176),0xbb8),await dpUploadFile(_0x57dcb0+_0x561692(0x168)+_0x38df88+_0x561692(0x176),_0x56db4c);}}}catch(_0x5e1413){console[_0x561692(0x199)](_0x561692(0x1a9)+_0x575524+':',_0x5e1413);}}}else console[_0x561692(0x150)](_0x561692(0x14b));}}),dropboxCloud[_0x47acd0(0x15c)](_0x47acd0(0x1aa),function(){var _0x42eed2=_0x47acd0;const _0x553fed=localStorage['getItem'](_0x42eed2(0x1b0));_0x553fed===null||_0x553fed===''?authorizeWithDropbox():window['confirm'](_0x42eed2(0x1a1))&&(localStorage[_0x42eed2(0x167)](_0x42eed2(0x1b0),''),dropboxRestore[_0x42eed2(0x18e)][_0x42eed2(0x195)](_0x42eed2(0x16d)),dropboxBackup[_0x42eed2(0x18e)]['remove']('active'),dropboxCloud[_0x42eed2(0x18e)]['remove']('active'));}),handleDropboxCallback();});