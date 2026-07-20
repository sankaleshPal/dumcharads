const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp'); // for jimp 1.x or Jimp directly for 0.x

const dir = path.join(process.cwd(), 'assets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

(async () => {
  for (let f of files) {
    try {
      const p = path.join(dir, f);
      // In jimp 1.x it's Jimp.read or Jimp.fromFile? Let's just require the default jimp
      const jimpModule = require('jimp');
      const read = jimpModule.read || (jimpModule.Jimp && jimpModule.Jimp.read);
      if (!read) throw new Error("Could not find Jimp.read");
      
      const image = await read(p);
      await image.write(p);
      console.log('Fixed', f);
    } catch (e) {
      console.error('Error with', f, e.message);
    }
  }
})();
