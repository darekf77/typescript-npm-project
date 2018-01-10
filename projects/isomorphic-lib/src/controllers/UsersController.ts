

import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, Connection, OrmConnection
} from 'isomorphic-rest';
import { Repository } from "typeorm";

import { User, Book, Author } from "../entities";

@ENDPOINT()
export class UsersController extends BaseCRUD<User>
{
    @OrmConnection connection: Connection;
    @BaseCRUDEntity(User) public entity: User;
    private reposiotry: Repository<User>;
    constructor() {
        super();


    }


}
