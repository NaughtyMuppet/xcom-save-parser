import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { getSaveInfo } from '../parse-save';
export const main = async () => {
    const saveFile = process.argv[2];
    const saveFilePath = join(process.cwd(), saveFile);
    const data = await readFile(saveFilePath);

    writeFileSync(saveFilePath + '.json', JSON.stringify(getSaveInfo(data), null, 2));
};

void main();
