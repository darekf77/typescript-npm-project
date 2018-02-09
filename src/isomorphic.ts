
import * as fs from 'fs';

function replace(c = '', words = []) {
    if (words.length === 0) return c;
    var word = words.shift();
    var regexPattern = new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
    c = c.replace(regexPattern, '');
    return replace(c, words);
}

export class IsomorphicRegions {

    public static deleteFrom(file: string): void {
        const fileContent = fs.readFileSync(file, 'utf8').toString();
        const resultContent = replace(fileContent, ["backend", "nodejs", "node"])
        fs.writeFileSync(file, resultContent, 'utf8');
    }


}