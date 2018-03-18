
import { META_INFO_ENTITY } from "./entity";

export abstract class BASE_CONTROLLER {

  abstract get ENTITIES(): { [entities: string]: META_INFO_ENTITY<any, any> };

}
