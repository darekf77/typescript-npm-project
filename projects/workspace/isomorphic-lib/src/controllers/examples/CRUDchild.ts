

import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, OrmConnection, CLASSNAME
} from 'morphi';

import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";

// local
import { Book } from '../../entities/examples/Book';


import { CRUDparent } from "./CRUDparent";


@ENDPOINT({ path: '/normalCRUDihuj' })
@CLASSNAME('CRUDchild')
export class CRUDchild extends CRUDparent {
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
        book1.title = 'pizda'
        let book2 = new Book();
        book2.title = 'dupa'
        await this.repository.save([book1, book2] as any)
        //#endregion
    }
}
