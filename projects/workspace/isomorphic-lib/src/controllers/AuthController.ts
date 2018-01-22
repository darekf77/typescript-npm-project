
import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, OrmConnection, Connection, Errors
} from 'isomorphic-rest';
//#region backend
import { authenticate, use } from "passport";
import { Strategy, IStrategyOptions } from "passport-http-bearer";
import { isEmail, isLowercase, isLength } from "validator";
import * as q from 'q';
import * as bcrypt from "bcrypt";
import * as graph from "fbgraph";
//#endregion

import { USER, IUSER } from '../entities/USER'
import { SESSION } from '../entities/SESSION';
import { EMAIL } from "../entities/EMAIL";
import { EMAIL_TYPE } from "../entities/EMAIL_TYPE";


export interface IHelloJS {
    authResponse: {
        state: string;
        access_token: string;
        expires_in: number;
        client_id: string;
        network: string;
        display: string;
        redirect_uri: string;
        scope: string;
        expires: number;
    }
    network: 'facebook' | 'google' | 'twitter';
    data: IFacebook;
}

export interface IFacebook {
    email: string;
    firstname: string;
    lastname: string;
    name: string;
    timezone: number;
    verified: boolean;
    id: string;
    picture: string;
    thumbnail: string;
}


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


    @GET('/')
    info(): Response<USER> {
        //#region backend
        return async (req) => {
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

    @GET('/check/exist/:username_or_email')
    checkExist( @PathParam('username_or_email') param: string): Response<Boolean> {
        //#region backend
        const self = this;
        return async (req, res) => {

            if (!param) {
                throw 'You need to specify parameter'
            }

            if (isEmail(param)) {
                const email = await self.__check.exist.email(param)
                if (email) {
                    return true;
                }
                else {
                    throw 'Email does not exist'
                }
            }
            else if (this.__validate.username(param)) {
                const username = await self.__check.exist.username(param)
                if (username) {
                    return true;
                }
                throw 'User does not exist'
            }
            throw 'Bad parameter'
        }
        //#endregion
    }

    @POST('/logout')
    logout(): Response<boolean> {
        //#region backend
        return async (req) => {
            const repo = await this.repos();
            var user = await repo.user
                .createQueryBuilder(USER.name)
                .innerJoinAndSelect(`${USER.name}.emails`, 'emails')
                .where(`${USER.name}.id = :id`)
                .setParameter('id', req.user.id)
                .getOne()
            if (!user) {
                return false;
            }
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
            return true;
        }
        //#endregion
    }

    @POST('/login')
    login( @BodyParam() body: IHelloJS & IUSER) {
        //#region backend
        const self = this;
        return async (req) => {
            const userIP = req.ip;
            let user: USER;
            if (body.authResponse && body.network && body.network === 'facebook') {
                user = await self.__authorization.facebook(body);
            } else {
                if (self.__check.ifRegistration(body)) {
                    user = await self.__authorization.email.register(body)
                } else {
                    user = await self.__authorization.email.login(body)
                }
            }
            return self.__token(user, userIP);
        }
        //#endregion
    }

    get __authorization() {
        //#region backend
        const self = this;
        return {
            async facebook(body: IHelloJS): Promise<USER> {
                //#region facebook authentication
                let fb = await self.__handle.facebook().getData(body)
                let dbEmail = await self.__check.exist.email(fb.email);
                if (dbEmail && dbEmail.user) {
                    return dbEmail.user
                }
                // create facebook user if not exist
                const facebookUserData = {
                    email: fb.email,
                    email_type: EMAIL.types.facebook,
                    username: `_facebook_${fb.id}`,
                    password: undefined,
                    firstname: `_facebook_${fb.firstname}`,
                    lastname: `_facebook_${fb.lastname}`
                }
                const user = await self.__createUser(facebookUserData)
                if (!user) {
                    throw 'Not able to create facebook user'
                }
                return user;
                //#endregion
            },
            email: {
                async login(form: IUSER): Promise<USER> {
                    if (form.email && isEmail(form.email)) {
                        // throw 'Wrong form email field format'
                        let email = await self.__check.exist.email(form.email);
                        if (!email) {
                            throw `Wrong login email ${form.email}`
                        }
                        if (email && email.user) {
                            return email.user;
                        }
                    } else if (self.__validate.username(form.username)) {
                        const user = await self.__check.exist.username(form.username)
                        if (user && bcrypt.compareSync(form.password, user.password)) {
                            return user;
                        }
                        throw 'Bad user or password'
                    }
                    throw 'Wron email or username'
                },
                async register(form: IUSER): Promise<USER> {
                    const emailExist = await self.__check.exist.email(form.email);
                    if (emailExist) {
                        throw `Email ${form.email} already exist in db`
                    }
                    form.email_type = EMAIL.types.normal_auth;
                    const user = await self.__createUser(form)
                    return user;
                }
            }
        }
        //#endregion
    }

    get __handle() {
        //#region backend
        const self = this;
        return {
            facebook() {
                //#region  facebook
                const APP_ID = '1248048985308566';
                return {
                    async getData(credentials: IHelloJS) {
                        await self.__handle.facebook().checkAppID(credentials)
                        const data = await self.__handle.facebook().getUserData(credentials);
                        return data;
                    },
                    checkAppID(credentials: IHelloJS) {
                        const defer = q.defer()
                        graph.setAccessToken(credentials.authResponse.access_token);
                        graph.get(credentials.authResponse.client_id, (err, res) => {
                            if (err) {
                                defer.reject(err)
                                return
                            }
                            // if (res.id !== APP_ID) {
                            //     defer.reject('Bad app id')
                            //     return
                            // }
                            defer.resolve(res)
                        });
                        return defer.promise;
                    },
                    getUserData(credentials: IHelloJS) {
                        const defer = q.defer<IFacebook>()
                        const userid = credentials.data.id
                        const fileds = 'email,id'
                        graph.setAccessToken(credentials.authResponse.access_token);
                        graph.get(`${userid}?fields=${fileds}`, (err, res: IFacebook) => {
                            if (err) {
                                defer.reject(err)
                                return
                            }
                            if (res.id != credentials.data.id) defer.reject('Bad user id')
                            else defer.resolve(res)
                        });
                        return defer.promise;
                    }
                }
                //#endregion
            }
        }
        //#endregion
    }

    get __validate() {
        //#region backend
        return {
            username(username) {
                if (username && isLength(username, 3, 50)) return true;
                return false;
            }
        }
        //#endregion
    }

    get __check() {
        //#region backend
        const self = this;
        return {
            exist: {
                async username(username: string) {
                    const repo = await self.repos();
                    let user = await repo.user.findOne({
                        where: { username }
                    })
                    return user;
                },
                async email(address: string) {
                    const repo = await self.repos();
                    let email = await repo.email
                        .createQueryBuilder(EMAIL.name)
                        .innerJoinAndSelect(`${EMAIL.name}.user`, 'user')
                        .where(`${EMAIL.name}.address = :email`)
                        .setParameter('email', address)
                        .getOne()
                    return email;
                }
            },
            ifRegistration(body: IUSER) {
                const {
                    email,
                    username,
                    password,
                    firstname,
                    lastname,
                    city
                } = body;
                const is = {
                    registration: (
                        !!password &&
                        !!email &&
                        !!username &&
                        !!firstname &&
                        !!lastname &&
                        !!city
                    ),
                    login: (!!password &&
                        (!!email || !!username))
                }
                return is.registration;
            }
        }
        //#endregion
    }

    async  __token(user: USER, ip: string) {
        //#region backend
        if (!user) {
            throw 'No user to send token'
        }
        const repo = await this.repos();
        const t = new SESSION();
        t.user = user;
        t.ip = ip;
        if (user.username == 'postman') t.createToken('postman');
        else t.createToken();
        await repo.auth.save(t)

        const expires_in = Math.round((t.expired_date.getTime() - t.created.getTime()) / 1000);
        return {
            access_token: t.token,
            expires_in,
            token_type: 'bearer'
        }
        //#endregion
    }

    async __createUser(formData: IUSER) {
        //#region backend
        const repo = await this.repos();
        if (formData && !formData.email_type) {
            formData.email_type = EMAIL_TYPE.types.normal_auth;
        }

        const email = new EMAIL(formData.email);
        email.types.push(formData.email_type)
        await repo.email.save(email)
        formData.email_type.emails.push(email);
        await repo.emailType.save(formData.email_type);

        const salt = bcrypt.genSaltSync(5);
        const user = new USER();
        user.password = bcrypt.hashSync(formData.password ? formData.password : 'ddd', salt)

        if (formData.username && isLowercase(formData.username) && isLength(formData.username, 3, 50)) {
            let existingUser = await repo.user.findOne({
                where: { username: formData.username }
            })
            if (existingUser) return undefined;
            user.username = formData.username
        } else {
            throw 'User exist'
        }
        user.emails.push(email);

        // persist data
        await repo.user.save(user)
        email.user = user;
        await repo.email.updateById(email.id, email)
        return user;
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