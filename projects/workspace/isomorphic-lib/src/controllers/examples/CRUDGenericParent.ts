
import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, Connection, OrmConnection,
    CLASSNAME
} from 'morphi';

import { Book } from '../../entities/examples/Book';

@ENDPOINT()
@CLASSNAME('CRUDGenericParent')

export class CRUDGenericParent<T> extends BaseCRUD<T> {


}