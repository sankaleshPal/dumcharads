const cp = require('child_process');
const log = cp.execSync('adb logcat -d', { encoding: 'utf8', maxBuffer: 10*1024*1024 });
const lines = log.split('\n');
const errors = lines.filter(l => l.includes('ReactNativeJS') || l.includes('AndroidRuntime') || l.includes('FATAL EXCEPTION') || l.includes('Error'));
console.log(errors.slice(-50).join('\n'));
