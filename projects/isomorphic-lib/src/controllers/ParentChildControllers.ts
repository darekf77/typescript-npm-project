import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, getResponseValue, OrmConnection, Connection
} from 'isomorphic-rest';
import { Observable } from 'rxjs/Observable';


@ENDPOINT()
export class ParentClass {

    @OrmConnection connection: Connection;

    @GET('/hello')
    get(): Response<any> {
        return { send: 'root' }
    }

    @GET('/loveme')
    loveme(): Response<any> {
        return { send: 'I love you' }
    }

}

@ENDPOINT()
export class ChildClass extends ParentClass {

    @GET('/saySomething')
    get(): Response<any> {
        const base = super.get()
        return async (req, res) => {
            const send = await getResponseValue<string>(base, req, res);
            return `child2(${send})`
        }
    }

}


@ENDPOINT((parhes => parhes.join('') + '/superChild'))
export class ChildClass2 extends ChildClass {

    @GET('/saySomething')
    get(): Response<any> {
        const base =super.get()
        return async (req, res) => {
            const send = await getResponseValue<string>(base, req, res);
            return `child2(${send})`
        }
    }

}

