import * as _ from 'lodash';
export class TsCodeModifer {


  public replace(input: string, regex: RegExp, replacement: string) {

    return input.split('\n').map(line => {
      const lineTrim = line.trim()
      if (lineTrim.startsWith('//')) {
        return line;
      }
      if (
        lineTrim.startsWith('import ') ||
        lineTrim.startsWith('export ') ||
        /^\}\s+from\s+(\"|\')/.test(lineTrim) ||
        /require\((\"|\')/.test(lineTrim)
      ) {
        return line.replace(regex, replacement);
      }
      return line;
    }).join('\n');
  }

  /**
   * fix double apostrophes in imports,export, requires
   */
  fixDoubleApostophe(input: string) {
    const regex = /(import|export|require\(|\}\sfrom\s(\"|\')).+(\"|\')/g;
    const matches = input.match(regex);
    if (_.isArray(matches)) {
      matches.forEach(m => {
        if (m.search('`') === -1) {
          input = input.replace(m, m.replace(/\"/g, `'`));
        }
      });
    }
    return input;
  }

}
