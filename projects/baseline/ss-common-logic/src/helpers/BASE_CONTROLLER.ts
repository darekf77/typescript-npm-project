
import { META } from "./meta-info";

export abstract class BASE_CONTROLLER {

  abstract get ENTITIES(): { [entities: string]: META<any, any> };

}
