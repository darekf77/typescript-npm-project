import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { META, CLASSNAME } from 'morphi';
import * as _ from 'lodash';

export type ProgressBarStatus = 'notstarted' | 'inprogress' | 'complete' | 'error';

export type ProgressBarType = 'determinate' | 'indeterminate' | 'buffer' | 'query';



export interface IPROGRESS_BAR_DATA {
    /**
     * How man percent of
     */
    value: number;
    status: ProgressBarStatus;
    info: string;
}


export class PROGRESS_BAR_DATA implements IPROGRESS_BAR_DATA {

    public static log(log: IPROGRESS_BAR_DATA) {
        console.log(`[[[${JSON.stringify({ value: log.value, info: log.info, status: log.status })}]]]`)
    }

    @PrimaryGeneratedColumn()
    id: number;

    public static resolveFrom(chunk: string, callbackOnFounded: (json: PROGRESS_BAR_DATA) => any, checkSplit = true) {
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
                const res = _.merge(new PROGRESS_BAR_DATA(), p);
                callbackOnFounded(res);
            } catch (error) {
                console.error(`ProgresssBarData: fail to parse "${progress}"`)
            }
        }
    }

    public value: number = 0;
    public status: ProgressBarStatus = 'notstarted';
    public info: string = '';



    toString = () => {
        return `Progress: ${this.value}  ${this.info ? (' - ' + this.info) : ''}`;
    }


}

