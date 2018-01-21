
import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, getResponseValue, OrmConnection, Connection
} from 'isomorphic-rest';

import { ChildClass } from "./Child1Controller";

@ENDPOINT((parhes => parhes.join('') + '/superChild'))
export class ChildClass2 extends ChildClass {

    @GET('/saySomething')
    get(): Response<any> {
        //#region backend
        const base = super.get()
        return async (req, res) => {
            const send = await getResponseValue<string>(base, req, res);
            return `child2(${send})`
        }
        //#endregion
    }

}

export default ChildClass2;