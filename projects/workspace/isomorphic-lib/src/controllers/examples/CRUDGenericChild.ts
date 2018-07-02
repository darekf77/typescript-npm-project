

import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, OrmConnection, CLASSNAME
} from 'morphi';

import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";

// local
import { Book } from '../../entities/examples/Book';


import { CRUDGenericParent } from "./CRUDGenericParent";


@ENDPOINT()
@CLASSNAME('CRUDGenericChild')
export class CRUDGenericChild extends CRUDGenericParent<Book> {
    
    @BaseCRUDEntity(Book) public entity: Book;
    constructor() {
        super();
        if (isNode) {
            this.createBooks()
        }
    }

    async createBooks() {
        //#region @backendFunc
        let book1 = new Book();
        book1.title = 'jhjh'
        let book2 = new Book();
        book2.title = 'dfg'
        await this.repository.save([book1, book2] as any)
        //#endregion
    }
}
