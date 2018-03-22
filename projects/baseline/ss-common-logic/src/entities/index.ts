import { getMeta, META_INFO_ENTITY } from '../helpers';
// entites
import { EMAIL, EMAIL_REPOSITORY } from "./EMAIL";
export { EMAIL, EMAIL_REPOSITORY } from "./EMAIL";
import { USER, USER_REPOSITORY } from "./USER";
export { USER, USER_REPOSITORY } from "./USER";
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY, EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
export { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY, EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from "./SESSION";
export { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from "./SESSION";


export function ENTITIES() {
    return {
        USER: getMeta<USER, USER_REPOSITORY>(
            this.connection, USER, USER_REPOSITORY
        ),
        SESSION: getMeta<SESSION, SESSION_REPOSITORY>(
            this.connection, SESSION, SESSION_REPOSITORY, SESSION_CONFIG
        ),
        EMAIL: getMeta<EMAIL, EMAIL_REPOSITORY>(
            this.connection, EMAIL, EMAIL_REPOSITORY
        ),
        EMAIL_TYPE: getMeta<EMAIL_TYPE, EMAIL_TYPE_REPOSITORY>(
            this.connection, EMAIL_TYPE, EMAIL_TYPE_REPOSITORY
        )
    }
}