export type ProgressBarStatus = 'notstarted' | 'inprogress' | 'complete' | 'error';

export type ProgressBarType = 'determinate' | 'indeterminate' | 'buffer' | 'query';


export class ProgressBarData {

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


