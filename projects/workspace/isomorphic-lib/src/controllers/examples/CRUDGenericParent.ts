
import {
    ENDPOINT, BaseCRUD, CLASSNAME
} from 'morphi';


@ENDPOINT()
@CLASSNAME('CRUDGenericParent')

export class CRUDGenericParent<T> extends BaseCRUD<T> {


}