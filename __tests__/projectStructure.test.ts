import fs from 'fs';
import path from 'path';

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Metro and Jest try file extensions in different orders (Metro: js, json, ts;
 * Jest: ts before json). `import './catalog'` with both catalog.json and
 * catalog.ts therefore resolves to different files in the app and in tests,
 * and the tests stay green while the app breaks.
 */
describe('source layout', () => {
  it('has no two files with the same name and different extensions in one folder', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];

    for (const file of listFiles(path.join(__dirname, '..', 'src'))) {
      const key = file.slice(0, file.length - path.extname(file).length);
      const other = seen.get(key);
      if (other) {
        clashes.push(`${path.basename(other)} / ${path.basename(file)}`);
      }
      seen.set(key, file);
    }

    expect(clashes).toEqual([]);
  });
});
