const fs = require('fs');
const lines = fs.readFileSync('logcat.txt', 'utf8').split('\n');
const errors = lines.filter(l => l.includes('AndroidRuntime') || l.includes('ReactNativeJS') || l.includes('FATAL EXCEPTION') || (l.includes(' E ') && l.includes('com.sankalesh.dumcharads')));
console.log(errors.slice(-50).join('\n'));
