
import { Config } from "../../environment";

declare global {
  const ENV: Config;

}



/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}





