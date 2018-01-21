
import { Repo } from "./LoginRegister";
import { EMAIL } from "../../entities/EMAILS";
import { USER } from "../../entities/USERS";
import { isEmail, isLowercase, isLength } from "validator";
import { EMAIL_TYPE } from "../../entities/EMAIL_TYPES";
import * as bcrypt from "bcrypt";
import * as q from "q";


export async function createUser(d: NewUserData, repo: Repo) {
    let defer = q.defer<USER>();
    if(d && !d.email_type) d.email_type = EMAIL_TYPE.types.normal_auth;
    try {
        let email = new EMAIL(d.email);
        email.types.push(d.email_type)
        await repo.emails.persist(email)
        d.email_type.emails.push(email);
        await repo.email_type.persist(d.email_type);

        let salt = bcrypt.genSaltSync(5);
        let user = new USER();
        user.password = bcrypt.hashSync(d.password ? d.password : 'ddd', salt)

        if (d.username && isLowercase(d.username) && isLength(d.username, 3, 50)) {
            let existingUser = await repo.user.findOne({
                where: { username: d.username }
            })
            if (existingUser) return undefined;
            user.username = d.username
        } else  {
            defer.reject('User exist')
            return
        }
        user.emails.push(email);
        // persist data
        await repo.user.persist(user)
        email.user = user;
        await repo.email.updateById(email.id, email)
        defer.resolve(user);
    } catch (error) {
        console.log(error)
    }
    return defer.promise;
}


export interface NewUserData {
    email: string;
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    city?: string;
    email_type?: EMAIL_TYPE;
}
