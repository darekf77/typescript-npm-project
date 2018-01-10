

import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD
} from 'isomorphic-rest';


@ENDPOINT('/asdasd')
export class TestController {
    @GET('/aaa')
    get(): Response<any> {
        return { send: 'dupa' }
    }
}
