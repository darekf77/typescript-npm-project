import * as q from "q";
import * as graph from "fbgraph";
import * as request from "request";

import { HelloJSCredentials, FacebookData } from "./HelloJSCredentials";

const APP_ID = '1248048985308566'

export async function handleFacebok(credentials: HelloJSCredentials) {
    let defer = q.defer<FacebookData>()
    let usedata: FacebookData;
    try {
        await checkAppID(credentials)
        usedata = await getUserData(credentials);
        defer.resolve(usedata)
    } catch (error) {
        console.log(error)
        defer.reject(error)
    }
    return defer.promise;
}

function checkAppID(credentials: HelloJSCredentials) {
    let defer = q.defer()
    graph.setAccessToken(credentials.authResponse.access_token);
    graph.get(credentials.authResponse.client_id, (err, res) => {
        if (err) {
            defer.reject(err)
            return
        }
        // if (res.id !== APP_ID) {
        //     defer.reject('Bad app id')
        //     return
        // }
        defer.resolve(res)
    });
    return defer.promise;
}

function getUserData(credentials: HelloJSCredentials) {
    let defer = q.defer<FacebookData>()
    let userid = credentials.data.id
    let fileds = 'email,id'
    graph.setAccessToken(credentials.authResponse.access_token);
    graph.get(`${userid}?fields=${fileds}`, (err, res: FacebookData) => {
        if (err) {
            defer.reject(err)
            return
        }
        if (res.id != credentials.data.id) defer.reject('Bad user id')
        else defer.resolve(res)
    });
    return defer.promise;
}