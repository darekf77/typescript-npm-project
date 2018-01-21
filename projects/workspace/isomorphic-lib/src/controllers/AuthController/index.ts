
import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, OrmConnection, Connection, Errors
} from 'isomorphic-rest';
//#region backend
import { authenticate, use } from "passport";
import { Strategy, IStrategyOptions } from "passport-http-bearer";
//#endregion

import { USER } from '../../entities/USER'
import { SESSION } from '../../entities/SESSION';
import { EMAIL } from "../../entities/EMAIL";
import { EMAIL_TYPE } from "../../entities/EMAIL_TYPE";

export function routeAuthentication() {
    return authenticate('bearer', { session: false });
}

@ENDPOINT()
export class AuthController {

    @OrmConnection connection: Connection;

    private async repos() {
        //#region backend
        const auth = await this.connection.getRepository(SESSION);
        const user = await this.connection.getRepository(USER);
        const email = await this.connection.getRepository(EMAIL);
        const emailType = await this.connection.getRepository(EMAIL_TYPE);
        return {
            auth, user, email, emailType
        }
        //#endregion
    }

    constructor() {

        //#region backend
        this.__init()
        //#endregion
    }


    @GET('/auth2')
    test2(): Response {
        throw Errors.entityNotFound(USER)
        // return { send: 'asdasdasdas' }
    }

    @GET('/')
    test(): Response<USER> {
        //#region backend
        return async (req, res) => {
            const repo = await this.repos();
            const requestUser: USER = req['user'];
            const user = await repo.user
                .createQueryBuilder(USER.name)
                .innerJoinAndSelect(`${USER.name}.emails`, 'emails')
                .where(`${USER.name}.id = :id`)
                .setParameter('id', requestUser.id)
                .getOne()
            if (user) {
                user.session_expire_in = requestUser.session_expire_in
                return user;
            }
            throw Errors.entityNotFound(USER)
        }
        //#endregion
    }

    @GET('/logout')
    logout() {
        //#region backend
        return async (req) => {
            const repo = await this.repos();
            var user = await repo.user
                .createQueryBuilder(USER.name)
                .innerJoinAndSelect(`${USER.name}.emails`, 'emails')
                .where(`${USER.name}.id = :id`)
                .setParameter('id', req.user.id)
                .getOne()
            let token = await repo.auth
                .createQueryBuilder(SESSION.name)
                .innerJoinAndSelect(`${SESSION.name}.user`, 'user')
                .where(`${SESSION.name}.ip = :ip`)
                .andWhere('user.id = :userid')
                .setParameters({
                    ip: req.ip,
                    userid: req.user.id
                })
                .getOne()
            await repo.auth.removeById(token.id);
        }
        //#endregion
    }

    async __init() {
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