
//#region controler
import {
    HelloController,
    ParentClass, ChildClass, ChildClass2,
    UsersController,
    TestController
} from './controllers';
export * from './controllers';
export const Controllers = {
    HelloController,
    ParentClass, ChildClass, ChildClass2,
    UsersController,
    TestController
};
//#endregion

//#region entities
import {
    Author,
    User,
    Book
} from './entities';
export * from './entities';
export const Entities = {
    Author,
    User,
    Book
}
