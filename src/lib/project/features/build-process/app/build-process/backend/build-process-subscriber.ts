//#region @websql
//#region imports
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'firedev-typeorm/src';
import type { BuildProcess } from '../build-process';
//#endregion

/**
 * Events subscriber for BuildProcess
 *
 * + automate your database operation here
 */
@EventSubscriber()
export class BuildProcessSubscriber implements EntitySubscriberInterface {
  /**
   * Called after entity update.
   */
  // afterUpdate(event: UpdateEvent<BuildProcess>) {
  //   console.log(`AFTER ENTITY UPDATED: `, event.entity)
  // }
}
//#endregion
