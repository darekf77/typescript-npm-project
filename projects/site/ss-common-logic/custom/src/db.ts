import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import BUILD from "./entities/BUILD";

const sub = new Subject<BUILD>();


const db: {
    $BUILD?: { [s in keyof BUILD]: Observable<BUILD>; }

} = {} as any;



db.$BUILD.id.subscribe



