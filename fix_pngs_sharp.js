const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(process.cwd(), 'assets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

(async () => {
  for (let f of files) {
    try {
      const p = path.join(dir, f);
      const tmp = p + '.tmp.png';
      await sharp(p).png().toFile(tmp);
      fs.unlinkSync(p);
      fs.renameSync(tmp, p);
      console.log('Fixed', f);
    } catch (e) {
      console.error('Error with', f, e.message);
    }
  }
})();
