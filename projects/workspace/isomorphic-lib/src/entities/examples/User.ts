import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import Author from "./Author";
import Book from "./Book";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    username: string;

    friend: Author;

    books: Book[];

    public isAmazing() {
        return 'is amazing person'
    }
}

export default User;