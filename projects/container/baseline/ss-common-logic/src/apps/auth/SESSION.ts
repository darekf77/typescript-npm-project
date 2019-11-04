
import { Morphi } from 'morphi';
import { Resource } from 'ng2-rest';
import { USER } from '../user/USER';

//#region @backend
import { generate } from 'password-hash';

//#endregion


export const SESSION_CONFIG = {
  SESSION_TIME_SECONDS: 36000, // TODO smaller session on production
  SESSION_LOCAL_STORAGE: 'session-isomorphic-rest',
  AUTHORIZATION_HEADER: 'Authorization'
}

export class LocalStorage {
  CONFIG = SESSION_CONFIG;

  saveInLocalStorage(session: SESSION) {
    window.localStorage.setItem(this.CONFIG.SESSION_LOCAL_STORAGE, JSON.stringify(session));
  }

  fromLocalStorage(): SESSION {
    let session: SESSION = new SESSION();
    try {
      const data = window.localStorage.getItem(this.CONFIG.SESSION_LOCAL_STORAGE);
      const s = JSON.parse(data) as SESSION;
      session.token = s.token;
      session.token_type = s.token_type;
      session.expiredDate = new Date(s.expiredDate as any);
    } catch {
      session = undefined;
    }
    return session;
  }

  removeFromLocalStorage() {
    window.localStorage.removeItem(this.CONFIG.SESSION_LOCAL_STORAGE);
  }
}


export interface ISESSION {

}



@Morphi.Entity<SESSION>({
  className: 'SESSION',
  mapping: {
    createdDate: 'Date',
    expiredDate: 'Date',
    user: 'USER'
  }
})
export class SESSION extends Morphi.Base.Entity<SESSION> implements ISESSION {

  fromRaw(obj: Object): SESSION {
    throw new Error("Method not implemented.");
  }

  CONFIG = SESSION_CONFIG;

  expireInSeconds: number;
  calculateExpirationTime(): number {
    const now = new Date();
    return Math.round((this.expiredDate.getTime() - now.getTime()) / 1000);
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined


  //#region @backend
  @Morphi.Orm.Column.Custom({ length: 100 })
  //#endregion
  token: string = undefined

  token_type = 'bearer';

  //#region @backend
  @Morphi.Orm.Column.Custom({
    length: 50,
    nullable: true
  })
  //#endregion
  ip: string = undefined

  //#region @backend
  @Morphi.Orm.Column.CreateDate()
  //#endregion
  createdDate: Date = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom({
    nullable: false
  })
  //#endregion
  expiredDate: Date = undefined

  //#region @backend
  @Morphi.Orm.Relation.OneToOne(() => USER, user => user.id, {
    nullable: true
  })
  @Morphi.Orm.Join.Column()
  //#endregion
  user: USER;

  //#region @backend
  public createToken(token?: string) {
    this.createdDate = new Date();
    const timestamp = this.createdDate.getTime();
    this.token = token ? token : generate(this.user.id + timestamp + this.ip)
    this.expiredDate = new Date(timestamp + this.CONFIG.SESSION_TIME_SECONDS * 1000)
  }
  //#endregion

  isExpired(when: Date = new Date()) {
    let time = {
      expire: this.expiredDate.getTime(),
      now: when.getTime()
    }
    return (time.expire < time.now);
  }

  public get activationTokenHeader() {
    // console.log('THIS', this)
    const session: SESSION = this;
    return { name: this.CONFIG.AUTHORIZATION_HEADER, value: `${session.token_type} ${session.token}` };
  }

  public activateBrowserToken() {
    const session: SESSION = this;
    // console.log('THIS', this)
    Resource.DEFAULT_HEADERS.set(this.CONFIG.AUTHORIZATION_HEADER,
      `${session.token_type} ${session.token}`);
  }

  public static localStorage = new LocalStorage()

}


