import * as _ from 'lodash';
export type ProgressBarStatus = 'notstarted' | 'inprogress' | 'complete' | 'error';

export type ProgressBarType = 'determinate' | 'indeterminate' | 'buffer' | 'query';

export interface IProgressBarData {
  /**
   * How man percent of
   */
  value: number;
  status: ProgressBarStatus;
  info: string;
}

export const log = {
  data(log: IProgressBarData) {
    console.log(`[[[${JSON.stringify({ value: log.value, info: log.info, status: log.status })}]]]`)
  }

}
export class ProgressBarData implements IProgressBarData {


  public static resolveFrom(chunk: string, callbackOnFounded: (json: ProgressBarData) => any, checkSplit = true) {
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
        const res = _.merge(new ProgressBarData(), p);
        callbackOnFounded(res);
      } catch (error) {
        console.error(`ProgresssBarData: fail to parse "${progress}"`)
      }
    }
  }

  constructor(
    public value: number = 0,
    public status: ProgressBarStatus = 'notstarted',
    public info: string = ''

  ) {

  }

  toString = () => {
    return `Progress: ${this.value}  ${this.info ? (' - ' + this.info) : ''}`;
  }


}


