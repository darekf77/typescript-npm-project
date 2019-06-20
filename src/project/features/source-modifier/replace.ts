
export function replace(input: string, regex: RegExp, replacement: string) {

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
