import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity, EntityRepository } from 'typeorm';
import { CLASSNAME } from 'morphi';

export interface IEXAMPLE {
    id?: number;
    test: string;
}


//#region @backend
@Entity(META.tableNameFrom(EXAMPLE))
//#endregion
@CLASSNAME('EXAMPLE')
export class EXAMPLE extends META.BASE_ENTITY<EXAMPLE, IEXAMPLE> implements IEXAMPLE {

    fromRaw(obj: IEXAMPLE): EXAMPLE {
        let ex = new EXAMPLE();
        ex.test = obj.test;
        return ex;
    }

    @PrimaryGeneratedColumn()
    id: number = undefined

    @Column() test: string = undefined;

    @Column() otherData: string = 'asdasdasd';
}

export interface EXAMPLE_ALIASES {
    //#region @backend
    example: string;
    examples: string;
    //#endregion
}


@EntityRepository(EXAMPLE)
export class EXAMPLE_REPOSITORY extends META.BASE_REPOSITORY<EXAMPLE, EXAMPLE_ALIASES> {

    //#region @backend
    globalAliases: (keyof EXAMPLE_ALIASES)[] = ['example', 'examples'];
    //#endregion

}
