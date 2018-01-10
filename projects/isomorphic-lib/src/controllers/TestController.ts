

import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, OrmConnection, Connection
} from 'isomorphic-rest';
import { User, Book, Author } from "../entities";
import { Repository } from "typeorm";


@ENDPOINT()
export class TestController extends BaseCRUD<Book> {
    @BaseCRUDEntity(Book) public entity: Book;
    constructor() {
        super();
        if (isNode) {;
            this.createBooks()
        }
    }

    async createBooks() {
        let book1 = new Book();
        book1.title = 'aaaasdasd'
        let book2 = new Book();
        book2.title = 'aaaasdasd'
        this.repository.save([book1, book2] as any)
    }
}
