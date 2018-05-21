import { EnvConfig } from "tnp";

declare global {
    const ENV: EnvConfig;
}


/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}




