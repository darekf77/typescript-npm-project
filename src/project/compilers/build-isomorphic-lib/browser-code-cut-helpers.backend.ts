import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import * as sass from 'node-sass';

import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { Project } from '../../abstract';

export function REGEX_REGION_HTML(word) {
  const regex = new RegExp("[\\t ]*\\<\\!\\-\\-\\s*#?region\\s+" +
    word + " ?[\\s\\S]*?\\<\\!\\-\\-\\s*#?endregion\\s\\-\\-\\> ?[\\t ]*\\n?", "g");
  // this.isDebuggingFile && console.log(regex.source)
  return regex;
}
