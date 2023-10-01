Redirect things

```ts
 private server(onServerReady: (serverPort?: number) => void) {
    const proxy = httpProxy.createProxyServer({});

    const server = http.createServer((req, res) => {
      const target = this.getTarget(req);
      if (target) {
        proxy.web(req, res, { target });
      } else {
        res.write('not found')
        res.end();
      }
    });

    server.on('upgrade', (req, socket, head) => {
      const target = this.getTarget(req)
      proxy.ws(req, socket, head, target ? { target } : void 0);
    });

    const serverPort = this.project.getDefaultPort();

    server.listen(serverPort, () => {
      Helpers.log(`Proxy Router activate on ${this.project.env.config.workspace.workspace.host}`)
      if (_.isFunction(onServerReady)) {
        onServerReady(serverPort);
      }
    }).on('error', e => {
      Helpers.log('proxy server error ')
      Helpers.error(e, true, true)
    })
  }
  ```
