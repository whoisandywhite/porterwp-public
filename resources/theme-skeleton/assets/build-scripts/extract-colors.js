import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname is not defined in ES module scope, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assuming theme.json is in the project root
const themeJSONPath = path.join(__dirname, '../../theme.json');
const themeJSON = JSON.parse(fs.readFileSync(themeJSONPath, 'utf8'));
const colors = themeJSON.settings.color.palette;

let sassMap = '$colors: (';
colors.forEach((color, index) => {
  sassMap += `"${color.slug}": ${color.color}`;
  if (index < colors.length - 1) sassMap += ', ';
});
sassMap += ');';

// Assuming _colors.scss should go into /assets/scss
const sassFilePath = path.join(__dirname, '../../assets/src/scss/_colors.scss');
fs.writeFileSync(sassFilePath, sassMap);
