import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, OrmConnection, Connection
} from 'isomorphic-rest';
import { User, Book, Author } from "../entities";

import { Repository } from "typeorm";


const test = new User();
test.username = 'Dariusz Filipiak';
test.books = [
    new Book()
]
test.friend = new Author();

//#region backend
enum USER_GROUPS {
    ADMIN, USER, USER_PREMIU
}
//#endregion

@ENDPOINT('/test')
export class HelloController {
    @OrmConnection connection: Connection;
    private repository: Repository<User>;
    user = new User();
    constructor() {
        //#region backend
        if (isNode) {
            console.log('I am in the contructor of HelloController !!', this.connection)
            // console.log('Pizda in constr', this['pizda'])
            this.repository = this.connection.getRepository(User) as any;
            const user = new User();
            user.username = 'Dariusz Filipiak Pierwszy';
            user.books = [
                new Book()
            ]
            user.friend = new Author();
            this.repository.save(user);
        }
        //#endregion
    }

    @PUT('/db/:id')
    modifyUser( @PathParam('id') id: number, @BodyParam('user') user): Response<any> {
        //#region backend
        test.username = user.username;
        return { send: test };
        //#endregion
    }

    @GET('/db/:id', true)
    getUser( @PathParam('id') id: number): Response<User> {
        //#region backend
        // return { send: test }

        return async (req, res) => {
            const user = await this.repository.findOne({});
            return user;
        }
        //#endregion
    };

    @GET('/aaooaoaoa/test/:id', true)
    getUsersList( @PathParam('id') id: number): Response<User[]> {
        //#region node
        return {
            send: (req, res) => {
                res.set('aaaaaa', 'bbbb');
                return [test, test]
            }
        }
        //#endregion
    };

    @DELETE('/db/:id')
    deleteUser( @PathParam('id') id: number): Response<any> {
        //#region node
        return { send: test }
        //#endregion
    };

    @GET('/:testing/basdasd/:foooo', true)
    getUserConfig( @PathParam('testing') test: string, @PathParam('foooo') booo: string): Response<any> {
        //#region backend
        console.log('I am original method');
        return { send: test };
        //#endregion
    }


    @POST('/user')
    saveUSer( @QueryParam('id_usera') id: number, @BodyParam() user): Response<any> {
        //#region backend
        return { send: { id, user } };
        //#endregion
    }

    @PUT('/user/:id')
    updateUSer( @PathParam('id') id: number, @CookieParam('test_cookie', 112) testCookie): Response<any> {
        //#region backend
        return { send: { id, testCookie } };
        //#endregion
    }

}

