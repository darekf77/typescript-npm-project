import {
  ENDPOINT, GET, POST, PUT, DELETE,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, getResponseValue, Connection, CLASSNAME,
  //#region @backend
  OrmConnection
  //#endregion
} from 'morphi';


@ENDPOINT()
@CLASSNAME('ParentClass')
export class ParentClass {

  //#region @backend
  @OrmConnection connection: Connection;
  //#endregion

  @GET('/hello')
  get(): Response<any> {
    return { send: 'root' }
  }

  @GET('/loveme')
  loveme(): Response<any> {
    return { send: 'I love you' }
  }

}



export default ParentClass;
