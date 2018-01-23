import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
// local
import { TestUser } from "./User";

@Entity(Author.name)
export class Author {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { nullable: true })
    age: number;

    user: TestUser;

    friends: TestUser[];
}

export default Author;