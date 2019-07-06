import { Subject } from './Subject';
import { Subscriber } from './Subscriber';
import { Subscription } from './Subscription';
/**
 * @class BehaviorSubject<T>
 */
export declare class BehaviorSubject<T> extends Subject<T> {
    private _value;
    constructor(_value: T);
    readonly value: T;
    protected _subscribe(subscriber: any): Subscription;
    getValue(): T;
    next(value: T): void;
}
