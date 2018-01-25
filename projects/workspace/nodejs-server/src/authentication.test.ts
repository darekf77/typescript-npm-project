
import { Connection } from "typeorm";

import { init } from "./init-test";

import { expect } from 'chai';

let connection: Connection;
before(async () => {
    const i = await init()
    connection = i.connection;
})

describe('Hello function', () => {
    it('should return hello world', () => {

        expect(connection).not.to.be.undefined('Undefined connection!!!');
    });
});