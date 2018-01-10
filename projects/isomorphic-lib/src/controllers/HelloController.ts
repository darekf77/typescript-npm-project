import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, OrmConnection, Connection
} from 'isomorphic-rest';
import { User, Book, Author } from "../entities";

import { Repository } from "typeorm";


const test = new User();
test.username = 'Dariusz Filipiak';
test.books = [
    new Book()
]
test.friend = new Author();


@ENDPOINT('/test')
export class HelloController {
    @OrmConnection connection: Connection;
    private repository: Repository<User>;
    constructor() {
        if (isNode) {
            console.log('I am in the contructor of HelloController !!', this.connection)
            // console.log('Pizda in constr', this['pizda'])
            this.repository = this.connection.getRepository(User) as any;
            const user = new User();
            user.username = 'Dariusz Filipiak';
            user.books = [
                new Book()
            ]
            user.friend = new Author();
            this.repository.save(user);
        }
    }

    @PUT('/db/:id')
    modifyUser( @PathParam('id') id: number, @BodyParam('user') user): Response<any> {
        test.username = user.username;
        return { send: test };
    }

    @GET('/db/:id', true)
    getUser( @PathParam('id') id: number): Response<User> {
        return async (req, res) => {
            const user = await this.repository.findOne({});
            return user;
        }
    };

    @GET('/aaooaoaoa/test/:id', true)
    getUsersList( @PathParam('id') id: number): Response<User[]> {
        return {
            send: (req, res) => {
                res.set('aaaaaa', 'bbbb');
                return [test, test]
            }
        }
    };

    @DELETE('/db/:id')
    deleteUser( @PathParam('id') id: number): Response<any> {
        return { send: test }
    };

    @GET('/:testing/basdasd/:foooo', true)
    getUserConfig( @PathParam('testing') test: string, @PathParam('foooo') booo: string): Response<any> {
        console.log('I am original method');
        return { send: test };
    }


    @POST('/user')
    saveUSer( @QueryParam('id_usera') id: number, @BodyParam() user): Response<any> {
        return { send: { id, user } };
    }

    @PUT('/user/:id')
    updateUSer( @PathParam('id') id: number, @CookieParam('test_cookie', 112) testCookie): Response<any> {
        return { send: { id, testCookie } };
    }

}

