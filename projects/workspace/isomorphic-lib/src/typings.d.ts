
import { EnvConfig } from "tnp";

declare global {
    const ENV: EnvConfig;
}

declare module "*.json" {
    const value: any;
    export default value;
}
