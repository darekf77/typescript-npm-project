import { _ } from 'tnp-core';

export function REGEX_REGION_HTML(word) {
  const regex = new RegExp("[\\t ]*\\<\\!\\-\\-\\s*#?region\\s+" +
    word + " ?[\\s\\S]*?\\<\\!\\-\\-\\s*#?endregion\\s\\-\\-\\> ?[\\t ]*\\n?", "g");
  // this.isDebuggingFile && console.log(regex.source)
  return regex;
}
