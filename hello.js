// var http = require('http');

// const port = Number(process.argv[2]) || 8080;
// //create a server object:
// http.createServer(function (req, res) {
//   res.write('Hello World!'); //write a response to the client
//   res.end(); //end the response
// }).listen(port,()=> {
//   console.log(`Listening on port ${port}`)
// }); //the server object listens on port 8080

// var fse = require('fs-extra');

// let file =  eval(fse.readFileSync('./mod.js').toLocaleString())

// console.log(file);

console.log(require('./dist/index').default)
