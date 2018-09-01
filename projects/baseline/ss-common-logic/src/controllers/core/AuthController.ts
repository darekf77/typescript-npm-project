
import {
  ENDPOINT, GET, POST, PUT, DELETE, isNode, Connection,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, OrmConnection, Errors, isBrowser, BaseCRUDEntity, CLASSNAME
} from 'morphi';

//#region @backend
import { authenticate, use } from 'passport';
import { Strategy, IStrategyOptions } from 'passport-http-bearer';
import { isEmail, isLowercase, isLength } from 'validator';
import * as q from 'q';
import { Handler } from 'express';
export { Handler } from 'express';
import * as bcrypt from 'bcrypt';
import * as graph from 'fbgraph';
import * as path from 'path';
//#endregion

import { Resource, HttpResponse, HttpResponseError } from "ng2-rest";
export { HttpResponse } from "ng2-rest";
import { Log, Level } from 'ng2-logger';

import { Observable, Subscribable } from "rxjs/Observable";

export { Observable } from "rxjs";
import { Subject } from "rxjs/Subject";
export { Subject } from "rxjs/Subject";

const log = Log.create('AuthController', Level.__NOTHING);


import { META } from '../../helpers';

import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { SESSION } from "../../entities/core/SESSION";



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
  };
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


@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    if (method === AuthController.prototype.login) {
      return;
    }
    if (method === AuthController.prototype.checkExist) {
      return;
    }
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
@CLASSNAME('AuthController')
export class AuthController extends META.BASE_CONTROLLER<entities.SESSION> {

  //#region @backend
  @OrmConnection connection: Connection;
  @BaseCRUDEntity(entities.SESSION) entity: entities.SESSION;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }
  //#endregion

  constructor() {
    super();
    isBrowser && this.browser.init()
  }

  private _subIsLggedIn = new Subject<boolean>();
  isLoggedIn = this._subIsLggedIn.asObservable();

  public get browser() {

    const self = this;
    return {
      async init(checkSession = true) {
        if (isNode) {
          return;
        }
        const session = entities.SESSION.localStorage.fromLocalStorage()
        if (!session) {
          self.browser.logout();
          return
        }
        if (session.isExpired()) {
          self.browser.logout(session);
          return
        }
        self.browser.authorize(session, checkSession)
      },
      async login({ username, password }) {
        log.i('username', username)
        log.i('password', password)
        try {
          const session = await self.login({
            username, password
          } as any).received
          log.i('session', session.body.json)
          self.browser.authorize(session.body.json);
        } catch (error) {
          log.er(error)
        }
      },
      async authorize(session: entities.SESSION, checkSession = true) {
        entities.SESSION.localStorage.saveInLocalStorage(session);
        session.activateBrowserToken();
        if (checkSession) {
          try {
            const info = await self.info().received
            log.i('info', info)
            self._subIsLggedIn.next(true)
          } catch (error) {
            const err: HttpResponseError = error;
            log.er(error)
            if (err.statusCode === 401) {
              self.browser.logout(session);
            }
          }
        }
      },
      async logout(session?: entities.SESSION) {
        self._subIsLggedIn.next(false)
        if (session) {
          try {
            const data = await self.logout()
            log.i('Is proper logout ?', data)
          } catch (error) {
            log.er(error)
          }
        }
        entities.SESSION.localStorage.removeFromLocalStorage();
      }
    }

  }


  @GET('/')
  info(): Response<entities.USER> {
    //#region @backendFunc
    const self = this;
    return async (req, res) => {

      if (!req.user) {
        throw new Error('Not loggin in user!');
      }
      const User = await this.db.USER.byId(req.user.id);
      if (User) {
        User.session = await this.db.SESSION.getByUser(User, req.ip);
        return User;
      }

      throw Errors.entityNotFound(entities.USER);
    };
    //#endregion
  }

  @GET('/check/exist/:username_or_email')
  checkExist(@PathParam('username_or_email') param: string): Response<Boolean> {
    //#region @backendFunc
    const self = this;
    return async (req, res) => {

      if (!param) {
        throw new Error('You need to specify parameter');
      }

      if (isEmail(param)) {
        const email = await self.__check.exist.email(param);
        if (email) {
          return true;
        } else {
          throw new Error('Email does not exist');
        }
      } else if (this.__validate.username(param)) {
        const username = await self.__check.exist.username(param);
        if (username) {
          return true;
        }
        throw new Error('User does not exist');
      }
      throw new Error('Bad parameter');
    };
    //#endregion
  }

  @POST('/logout')
  logout(): Response<boolean> {

    //#region @backendFunc
    const self = this;
    return async (req, res) => {

      let User: entities.USER = req.user;
      if (!User) {
        throw 'No user for logout';
      }
      User = await this.db.USER.byId(User.id);
      if (!User) {
        log.w(`Cannot find user with id:${req.user} `);
        return false;
      }
      const Session = await this.db.SESSION.getByUser(User, req.ip);
      if (!Session) {
        log.w(`Cannot find session for user:${User.username} `);
        return false;
      }
      await this.db.SESSION.remove(Session);
      return true;
    };
    //#endregion
  }

  @POST('/login')
  login(@BodyParam() body: IHelloJS & entities.IUSER): Response<entities.SESSION> {
    //#region @backendFunc
    const self = this;
    return async (req) => {
      const userIP = req.ip;
      let user: entities.USER;
      if (body.authResponse && body.network && body.network === 'facebook') {
        user = await self.__authorization.facebook(body);
      } else {
        if (self.__check.ifRegistration(body)) {
          user = await self.__authorization.email.register(body);
        } else {
          user = await self.__authorization.email.login(body);
        }
      }
      return self.__token(user, userIP);
    };
    //#endregion
  }

  get __authorization() {
    //#region @backendFunc
    const self = this;
    return {
      async facebook(body: IHelloJS): Promise<entities.USER> {

        const fb = await self.__handle.facebook().getData(body);
        const dbEmail = await self.__check.exist.email(fb.email);
        if (dbEmail && dbEmail.user) {
          return dbEmail.user;
        }
        // create facebook user if not exist
        const facebookUserData = {
          email: fb.email,
          email_type: await self.db.EMAIL_TYPE.getBy('facebook'),
          username: `_facebook_${fb.id}`,
          password: undefined,
          firstname: `_facebook_${fb.firstname}`,
          lastname: `_facebook_${fb.lastname}`
        };
        const user = await self.__createUser(facebookUserData, 'facebook');
        if (!user) {
          throw new Error('Not able to create facebook user');
        }
        return user;

      },
      email: {
        async login(form: entities.IUSER): Promise<entities.USER> {
          function checkPassword(user: entities.USER) {
            if (user && bcrypt.compareSync(form.password, user.password)) {
              return user;
            }
            throw new Error('Bad password or user!');
          }
          function checkUserName(username: string) {

          }
          if (form.email && isEmail(form.email)) {
            // throw 'Wrong form email field format'
            const email = await self.__check.exist.email(form.email);
            if (!email) {
              throw new Error(`Wrong login email ${form.email}`);
            }
            if (email && email.user) {
              checkPassword(email.user);
              return email.user;
            }
          } else if (self.__validate.username(form.username)) {
            const user = await self.__check.exist.username(form.username);
            checkPassword(user);
            return user;
          }
          throw new Error('Wron email or username');
        },
        async register(form: entities.IUSER): Promise<entities.USER> {

          const emailExist = await self.__check.exist.email(form.email);
          if (emailExist) {
            throw new Error(`Email ${form.email} already exist in db`);
          }
          const user = await self.__createUser(form, 'normal_auth');
          return user;
        }
      }
    };
    //#endregion
  }


  get __handle() {
    //#region @backendFunc
    const self = this;
    return {
      facebook() {

        const APP_ID = '1248048985308566';
        return {
          async getData(credentials: IHelloJS) {
            await self.__handle.facebook().checkAppID(credentials);
            const data = await self.__handle.facebook().getUserData(credentials);
            return data;
          },
          checkAppID(credentials: IHelloJS) {
            const defer = q.defer();
            graph.setAccessToken(credentials.authResponse.access_token);
            graph.get(credentials.authResponse.client_id, (err, res) => {
              if (err) {
                defer.reject(err);
                return;
              }
              // if (res.id !== APP_ID) {
              //     defer.reject('Bad app id')
              //     return
              // }
              defer.resolve(res);
            });
            return defer.promise;
          },
          getUserData(credentials: IHelloJS) {
            const defer = q.defer<IFacebook>();
            const userid = credentials.data.id;
            const fileds = 'email,id';
            graph.setAccessToken(credentials.authResponse.access_token);
            graph.get(`${userid}?fields=${fileds}`, (err, res: IFacebook) => {
              if (err) {
                defer.reject(err);
                return;
              }
              if (res.id !== credentials.data.id) {
                defer.reject('Bad user id');
              } else {
                defer.resolve(res);
              }
            });
            return defer.promise;
          }
        };

      }
    };
    //#endregion
  }


  private get __validate() {
    //#region @backendFunc
    return {
      username(username) {
        if (username && isLength(username, 3, 50)) {
          return true;
        }
        return false;
      }
    };
    //#endregion
  }



  get __check() {
    //#region @backendFunc
    const self = this;
    return {
      exist: {
        async username(username: string) {

          const user = await self.db.USER.findOne({
            where: { username }
          });
          return user;
        },
        async email(address: string) {
          const email = self.db.EMAIL.findBy(address);
          return email;
        }
      },
      ifRegistration(body: entities.IUSER) {
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
        };
        return is.registration;
      }
    };
    //#endregion
  }


  private async  __token(user: entities.USER, ip: string) {
    //#region @backendFunc
    if (!user || !user.id) {
      throw new Error('No user to send token');
    }

    let Session = await this.db.SESSION.getByUser(user, ip);
    if (Session) {
      log.i(`Session already exist for: ${user.username}`);
      return Session;
    }

    Session = await this.db.SESSION.getFrom(user, ip);
    return Session;
    //#endregion
  }

  public async __createUser(formData: entities.IUSER, EmailTypeName: entities.EMAIL_TYPE_NAME, withActiveSession = false) {
    //#region @backendFunc

    let EmailType = await this.db.EMAIL_TYPE.getBy(EmailTypeName);
    if (!EmailType) {
      throw new Error(`Bad email type: ${EmailTypeName}`);
    }

    let Email = new entities.EMAIL(formData.email);
    Email.types = [];
    Email.types.push(EmailType);
    Email = await this.db.EMAIL.save(Email);


    let User = await this.db.EMAIL.getUserBy(Email.address);
    if (User) {
      log.i(`User ${User.username} exist with mail ${Email.address}`);
      return User;
    }

    if (!formData.username) {
      throw new Error('Username is not defined');
    }
    if (!isLowercase(formData.username)) {
      throw new Error('Username is not a lowercas string');
    }
    if (!isLength(formData.username, 3, 50)) {
      throw new Error(`Bad username length, shoudl be  3-5`);
    }

    User = await this.db.USER.findOne({
      where: { username: formData.username }
    });
    if (User) {
      throw new Error(`User with username: ${formData.username} already exist`);
    }

    User = new entities.USER();
    User.emails = [];
    User.username = formData.username;
    const salt = bcrypt.genSaltSync(5);
    User.password = bcrypt.hashSync(formData.password ? formData.password : 'ddd', salt);
    User.emails.push(Email);
    User = await this.db.USER.save(User);

    Email.user = User;
    await this.db.EMAIL.save(Email);

    if (withActiveSession) {
      const session = new SESSION()
      session.user = User;
      session.ip = '::1';
      session.createToken(User.username)
      await this.db.SESSION.save(session);
    }

    return User;
    //#endregion
  }

  public async initExampleDbData() {
    //#region @backendFunc

    const strategy = async (token, cb) => {
      let user: entities.USER = null;
      const Session = await this.db.SESSION.getByToken(token);

      if (Session) {
        if (Session.isExpired()) {
          await this.db.SESSION.remove(Session);
          return cb(null, user);
        }
        user = Session.user;
        user.password = undefined;
      }
      return cb(null, user);
    };
    use(new Strategy(strategy));

    if (!ENV.workspace.build.server.production) {
      await this.__createUser({
        username: 'admin',
        email: 'admin@admin.pl',
        password: 'admin'
      }, 'normal_auth', true);
      await this.__createUser({
        username: 'postman',
        email: 'postman@postman.pl',
        password: 'postman'
      }, 'normal_auth', true);
    }
    //#endregion
  }



}


export default AuthController;
