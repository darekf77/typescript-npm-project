
import { Repository, Connection } from 'typeorm';

import {
    Controllers, Entities, User
} from 'isomorphic-lib/backend';


export class MockData {

    reposiory = {
        users: this.connection.getRepository(Entities.User as any),
    }
    constructor(private connection: Connection) {
        this.createUser();
        return this;
    }

    async createUser() {
        const user = new Entities.User();
        user.name = 'Dariusz';
        user.username = 'darekf77';
        await this.reposiory.users.save(user);
    }

}
