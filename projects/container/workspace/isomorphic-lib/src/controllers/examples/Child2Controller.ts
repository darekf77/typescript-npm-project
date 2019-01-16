
import {
    ENDPOINT, GET, Response, getResponseValue, CLASSNAME
} from 'morphi';

import { ChildClass } from "./Child1Controller";

@ENDPOINT({ path: '/superChild' })
@CLASSNAME('ChildClass2')
export class ChildClass2 extends ChildClass {

    @GET('/saySomething')
    get(): Response<any> {
        //#region @backendFunc
        const base = super.get()
        return async (req, res) => {
            const send = await getResponseValue<string>(base, req, res);
            return `child2(${send})`
        }
        //#endregion
    }

}

export default ChildClass2;
