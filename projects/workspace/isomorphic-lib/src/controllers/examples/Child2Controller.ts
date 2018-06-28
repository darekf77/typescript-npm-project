
import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, getResponseValue, OrmConnection, Connection, CLASSNAME
} from 'morphi';

import { ChildClass } from "./Child1Controller";

@ENDPOINT({ path: (pathes => pathes.join('') + '/superChild') })
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
