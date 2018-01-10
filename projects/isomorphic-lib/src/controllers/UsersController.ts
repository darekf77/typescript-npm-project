

import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity
} from 'isomorphic-rest';

import { User, Book, Author } from "../entities";

@ENDPOINT()
export class UsersController extends BaseCRUD<User>
{
    @BaseCRUDEntity(User) public entity: User;
    constructor() {
        super();
    }


}
