
import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, OrmConnection, Connection
} from 'isomorphic-rest';
//#region backend
import { authenticate, use } from "passport";
import { Strategy, IStrategyOptions } from "passport-http-bearer";
//#endregion

import USER from '../entities/USER'
import SESSION from '../entities/SESSION';
import { endianness } from 'os';

@ENDPOINT()
export class AuthController {

    @OrmConnection connection: Connection;

    private async repos() {
        //#region backedn
        const auth = await this.connection.getRepository(SESSION);
        const user = await this.connection.getRepository(USER);
        return {
            auth, user
        }
        //#endregion
    }

    constructor() {


        //#region backend
        this.init()
        //#endregion
    }




    @GET('/auth')
    test(): Response {
        return { send: "super! this is amazing" }
    }


    async init() {
        //#region backend

        const repo = await this.repos();

        const strategy = async (token, cb) => {
            let user: USER = null;
            let t = await repo.auth
                .createQueryBuilder(SESSION.name)
                .innerJoinAndSelect(`${SESSION.name}.user`, 'user')
                .where(`${SESSION.name}.token = :token`)
                .setParameter('token', token)
                .getOne()

            if (t) {
                let time = {
                    expire: t.expired_date.getTime(),
                    now: new Date().getTime()
                }
                if (time.expire < time.now) {
                    await repo.auth.remove(t);
                } else {
                    user = await repo.user.findOne({
                        where: { id: t.user.id }
                    })
                    if (user) user.session_expire_in = Math.round((time.expire - time.now) / 1000);
                }
            }
            if (user) {
                user.password = undefined;
            }
            return cb(null, user);
        }
        use(new Strategy(strategy));

        //#endregion
    }



}

export default AuthController;