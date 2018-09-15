//#region @backend
import { run } from "./run";
// import * as express from "express";

// const app = express()
// const server = app.listen(4200)
// server.on('listening', (err) => {
//     console.log('Port istenting')
// })
// server.on('error', (err) => {
//     console.log('Port busy')
// })

run(["--build-watch"])

//#endregion
