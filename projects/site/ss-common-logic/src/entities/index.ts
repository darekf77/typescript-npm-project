import { ENTITIES as BASELINE_ENTITIES } from "baseline/ss-common-logic/bundle/entities/index";
import { SESSION, SESSION_REPOSITORY, SESSION_CONFIG } from "./SESSION";
import { getMeta } from 'baseline/ss-common-logic/src/helpers';

export function ENTITIES() {
    const config = BASELINE_ENTITIES();
    config.SESSION = getMeta(this.connection, SESSION, SESSION_REPOSITORY, SESSION_CONFIG);
    return config as any;
}