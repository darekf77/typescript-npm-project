//#region node
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
//#endregion

import { User } from "./User";

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { nullable: true })
    age: number;
    user: User;
    friends: User[];
}

