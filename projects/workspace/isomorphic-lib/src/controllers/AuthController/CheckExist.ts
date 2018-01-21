import { Repo } from "./LoginRegister";
import { Request, Response } from "express";
import { isEmail, isLowercase, isLength } from "validator";
import { isValid } from "./Validators";
export async function checkExistInDb(req: Request, res: Response, repo: Repo) {
    let param = req.params['username_or_email']

    if (param) {
        try {
            if (isEmail(param)) {
                let email = await checkExist.email(param, repo)
                if (email) res.sendStatus(200)
                else res.status(400).send('Email does not exist')
            } 
            else if (isValid.username(param)) {
                let username = await checkExist.username(param, repo)
                if (username) res.sendStatus(200)
                else res.status(400).send('User does not exist')
            } 
            else res.status(400).send('Bad parameter')
        } 
        catch (error) {
            res.status(400).send(error)
        }
    } else res.status(400).send('You need to specify parameter')
}

export const checkExist = {
    username: async (username: string, repo: Repo) => {
        let user = await repo.user.findOne({
            where: { username }
        })
        return user;
    },
    email: async (address: string, repo: Repo) => {
        let email = await repo.email
            .createQueryBuilder('EMAILS')
            .innerJoinAndSelect('EMAILS.user', 'user')
            .where('EMAILS.address = :email')
            .setParameter('email', address)
            .getOne()
        return email;
    }
}