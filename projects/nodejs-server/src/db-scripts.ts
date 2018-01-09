
import { Repository, Connection } from 'typeorm';

import {
    Controllers, Entities, User
} from 'example-isomorphic-rest-shared';

export class MockData {

    reposiory = {
        users: this.connection.getRepository(User),
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
