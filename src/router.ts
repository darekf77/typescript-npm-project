import { ProjectWorkspace, Project } from "./project";
import * as child from 'child_process';
import * as portfinder from 'portfinder';
import { error } from "./messages";
import { TnpRoute } from "models";
import * as httpProxy from 'http-proxy';
import * as http from 'http';

export class ProjectRouter {

    public static killProcessOn(portNumber: number) {
        let pid = child.execFileSync(`lsof -t -i tcp:${portNumber}`).toString();
        child.execSync('kill -kill `lsof -t -i tcp:${portNumber}`');
    }

    private static takenPorts = [];

    public static async getFreePort(from: number = 4000) {
        try {
            // console.log(ProjectRouter.takenPorts)
            while (ProjectRouter.takenPorts.includes(from)) {
                from += 1;
            }
            // console.log('from ', from)
            ProjectRouter.takenPorts.push(from)
            const port = await portfinder.getPortPromise({ port: from })
            ProjectRouter.takenPorts.push(port);
            return port;
        } catch (err) {
            error(err)
        }
    }

    private getFreePort() {
        return ProjectRouter.getFreePort();
    }

    async run(projects: TnpRoute[]) {
        if (projects.length === 0) return;
        const p = projects.shift();
        const port = await this.getFreePort();
        console.log(`port ${port} for ${p.project.name}`)
        this.run(projects);
    }

    constructor(project: ProjectWorkspace) {
        const proxy = httpProxy.createProxyServer({});
        const server = http.createServer(function (req, res) {
            console.log(req.url)
            // You can define here your custom logic to handle the request
            // and then proxy the request.
            // proxy.web(req, res, { target: 'http://127.0.0.1:5060' });
            res.write(JSON.stringify(req.headers))
            res.end()
        });
        server.listen(project.isRunningOnPort)
        // this.run(project.routes)

    }

    async portTests() {
        console.log(await this.getFreePort())
        console.log(await this.getFreePort())
        console.log(await this.getFreePort())
    }

}