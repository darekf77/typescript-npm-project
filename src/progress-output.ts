import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers';

export interface IPROGRESS_DATA {
  /**
   * How man percent of
   */
  value?: number;
  msg?: string;
  date?: Date;
}


@CLASS.NAME('PROGRESS_DATA')
export class PROGRESS_DATA implements IPROGRESS_DATA {

  public static log(log: IPROGRESS_DATA) {
    console.log(`[[[${JSON.stringify({ value: log.value, msg: log.msg, date: new Date() } as IPROGRESS_DATA)}]]]`)
  }


  public static resolveFrom(chunk: string, callbackOnFounded: (json: PROGRESS_DATA) => any, checkSplit = true) {
    let progress;

    if (!_.isString(chunk)) {
      return;
    }
    chunk = chunk.trim();

    if (checkSplit) {
      const split = chunk.split(/\r\n|\n|\r/);
      if (split.length > 1) {
        // console.log('split founded', split)
        split.forEach(s => {
          this.resolveFrom(s, callbackOnFounded, false)
        })
        return
      }
    }

    if (/\[\[\[.*\]\]\]/g.test(chunk)) {
      chunk = chunk.replace(/^\[\[\[/g, '').replace(/\]\]\]$/g, '');
      progress = chunk;
    }
    if (!_.isUndefined(progress)) {
      try {
        const p = JSON.parse(progress);
        const res = _.merge(new PROGRESS_DATA(), p);
        callbackOnFounded(res);
      } catch (error) {
        console.error(`ProgresssBarData: fail to parse "${progress}"`)
      }
    }
  }

  public value: number;
  public msg: string;
  public date: Date;


}

