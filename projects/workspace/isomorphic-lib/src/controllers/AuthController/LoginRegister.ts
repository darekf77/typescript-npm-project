import { Response, Request } from "express";
import { HelloJSCredentials, FacebookData } from "./hellojs/HelloJSCredentials";
import { handleFacebok } from "./hellojs/HelloJSFacebook";
import { USER } from "../../entities/USERS";
import { AUTH } from "../../entities/AUTH";
import { Repository } from "typeorm";
import { EMAIL } from "../../entities/EMAILS";
import * as bcrypt from "bcrypt";
import { isEmail, isLength } from "validator";
import { EMAIL_TYPE_NAME, EMAIL_TYPE } from "../../entities/EMAIL_TYPES";
import { createUser } from "./CreateUser";
import { checkExist } from "./CheckExist";
import { isValid } from "./Validators";

export async function loginRegister(req: Request, res: Response, repo: Repo) {
    let body: HelloJSCredentials = req.body;

    if (body.authResponse && body.network && body.network === 'facebook') {
        // facebook authentication
        try {
            let fb = await handleFacebok(body)
            let dbEmail = await checkExist.email(fb.email, repo);
            if (dbEmail && dbEmail.user) {
                sendToken(dbEmail.user, res, req.ip, repo);
            } else {

                try {   // create facebook user
                    let user = await createUser({
                        email: fb.email,
                        email_type: EMAIL.types.facebook,
                        username: `_facebook_${fb.id}`,
                        password: undefined,
                        firstname: `_facebook_${fb.firstname}`,
                        lastname: `_facebook_${fb.lastname}`
                    }, repo)
                    sendToken(user, res, req.ip, repo);
                } catch (error) {
                    console.log(error)
                    res.sendStatus(400)
                }
            }
        } catch (error) {
            console.log(error)
            res.sendStatus(400)
        }
    }
    else { // normal authentication

        let form = {
            email: req.body['email'],
            username: req.body['username'],
            password: req.body['password'],
            firstname: req.body['firstname'],
            lastname: req.body['lastname'],
            city: req.body['city']
        }

        let is = {
            registration: (
                !!form.password &&
                !!form.email &&
                !!form.username &&
                !!form.firstname &&
                !!form.lastname &&
                !!form.city
            ),
            login: (!!form.password &&
                (!!form.email || !!form.username))
        }

        if (is.registration) {
            let emailExist = await checkExist.email(form.email, repo);
            if (emailExist) res.sendStatus(400);
            else {
                try {
                    // create normal user
                    let user = await createUser({
                        email: form.email,
                        email_type: EMAIL.types.normal_auth,
                        username: form.username,
                        password: form.password,
                        firstname: form.firstname,
                        lastname: form.lastname
                    }, repo)
                    sendToken(user, res, req.ip, repo);
                } catch (error) {
                    console.log(error)
                    res.status(400).send(error)
                }
            }
        } else if (is.login) {
            if (form.email && isEmail(form.email)) {
                let email = await checkExist.email(form.email, repo);
                if (email && email.user) {
                    sendToken(email.user, res, req.ip, repo);
                }
                else res.status(400).send({ msg: 'Wrong email' })
            } else if (isValid.username(form.username)) {
                let user = await checkExist.username(form.username, repo)
                if (user && bcrypt.compareSync(form.password, user.password)) {
                    sendToken(user, res, req.ip, repo);
                }
                else res.status(400).send('Wrong username')
            } else res.status(400).send('Wrong login data')
        } else res.status(400).send('Wrong form data')
    }
}

async function sendToken(user: USER, res: Response, ip: string, repo: Repo) {
    if (!user) res.send(404);
    let t = new AUTH();
    t.user = user;
    t.ip = ip;
    if (user.username == 'postman') t.createToken('postman');
    else t.createToken();
    await repo.auth.persist(t)
    let expires_in = Math.round((t.expired_date.getTime() - t.created.getTime()) / 1000);
    res.send({
        access_token: t.token,
        expires_in,
        token_type: 'bearer'
    })
}


export interface Repo {
    auth: Repository<AUTH>;
    user: Repository<USER>;
    email: Repository<EMAIL>;
    email_type: Repository<EMAIL_TYPE>;
}