
import {
    ENDPOINT, BaseCRUD, CLASSNAME
} from 'morphi';

import { Book } from '../../entities/examples/Book';

@ENDPOINT()
@CLASSNAME('CRUDparent')

export class CRUDparent extends BaseCRUD<Book> {


}