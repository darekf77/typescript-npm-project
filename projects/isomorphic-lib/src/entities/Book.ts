import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import { Author } from "./Author";

@Entity()
export class Book {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;


    author: Author;
}
