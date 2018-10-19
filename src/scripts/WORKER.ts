import { Worker } from 'webworker-threads';
import * as os from 'os';
import * as si from 'systeminformation';
var cpuid = require('cpuid');

// export function postMessage(s:string) {
//   console.log(s)
// }

export default {

  $WORKER_TEST: () => {

    var worker = new Worker(function () {
      this.postMessage(`I'm working before postMessage('ali').  Thread: ${this.thread.id} `);

      this.onmessage = function (event) {
        this.postMessage('Hi ' + event.data);
        self.close();
      };
    });

    var worker2 = new Worker(function () {
      this.postMessage(`I'm working before postMessage('ali'). Thread:  ${this.thread.id} `);

      this.onmessage = function (event) {
        this.postMessage('Hi ' + event.data);
        self.close();
      };
    });

    worker.onmessage = function (event) {
      console.log("Worker said : " + event.data);
    };
    worker.postMessage('ali');

    worker2.onmessage = function (event) {
      console.log("Worker2 said : " + event.data);
    };
    worker2.postMessage('ali2');
  }

}
