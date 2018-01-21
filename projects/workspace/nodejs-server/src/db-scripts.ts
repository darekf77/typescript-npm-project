
import { Repository, Connection } from 'typeorm';

import {
    Controllers, Entities, User
} from 'isomorphic-lib';


export class MockData {

    repo() {
        return {
            users: this.connection.getRepository(User)
        }
    }

    constructor(private connection: Connection) {
        this.createUser();
        return this;
    }

    async createUser() {
        const user = new User();
        user.name = 'Dariusz';
        user.username = 'darekf77';
        await this.repo().users.save(user);
    }

}
