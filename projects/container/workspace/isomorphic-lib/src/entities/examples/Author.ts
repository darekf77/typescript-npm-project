import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { CLASSNAME } from "morphi";
// local
import { TestUser } from "./User";

//#region @backend
@Entity(Author.name)
//#endregion
@CLASSNAME('Author')
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int", { nullable: true })
  age: number;

  user: TestUser;

  friends: TestUser[];
}

export default Author;
