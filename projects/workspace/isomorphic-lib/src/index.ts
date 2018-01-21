
//#region controler
import { UsersController } from "./controllers/examples/UsersController";
export { UsersController } from "./controllers/examples/UsersController";

import { HelloController } from "./controllers/examples/HelloController";
export { HelloController } from "./controllers/examples/HelloController";

import { TestController } from "./controllers/examples/TestController";
export { TestController } from "./controllers/examples/TestController";

import { ParentClass } from './controllers/examples/ParentControllers';
export { ParentClass } from './controllers/examples/ParentControllers';

import { ChildClass } from './controllers/examples/Child1Controller';
export { ChildClass } from './controllers/examples/Child1Controller';

import { ChildClass2 } from './controllers/examples/Child2Controller';
export { ChildClass2 } from './controllers/examples/Child2Controller';

import { AuthController } from './controllers/AuthController';
export { AuthController } from './controllers/AuthController';

export const Controllers = {
    UsersController,
    HelloController,
    TestController,
    ParentClass,
    ChildClass,
    ChildClass2,
    AuthController
};



import { User } from "./entities/examples/User";
export { User } from "./entities/examples/User";

import { Book } from "./entities/examples/Book";
export { Book } from "./entities/examples/Book";

import { Author } from "./entities/examples/Author";
export { Author } from "./entities/examples/Author";

import { EMAIL_TYPE } from "./entities/EMAIL_TYPE";
export { EMAIL_TYPE } from "./entities/EMAIL_TYPE";

import { EMAIL } from "./entities/EMAIL";
export { EMAIL } from "./entities/EMAIL";

import { USER } from "./entities/USER";
export { USER } from "./entities/USER";

import { SESSION } from "./entities/SESSION";
export { SESSION } from "./entities/SESSION";


export const Entities = {
    User,
    Book,
    Author,
    EMAIL_TYPE,
    EMAIL,
    USER,
    SESSION
};