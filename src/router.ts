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

    routes: TnpRoute[] = [];

    getProjectFrom(req: http.IncomingMessage): Project {
        const r = this.routes.find(r => {
            return new RegExp(`${r.url}/.*`, 'g').test(req.url)
        })
        if (r) {
            return r.project;
        }
    }

    constructor(project: ProjectWorkspace) {
        const proxy = httpProxy.createProxyServer({});
        const server = http.createServer((req, res) => {
            const p = this.getProjectFrom(req);
            if (p) {
                proxy.web(req, res, { target: `http://localhost:${p.activePort}` });
            } else {
                res.write('not found')
                res.end();
            }
        });
        server.listen(project.activePort)
        this.routes = [...project.routes];
        const routes = [...project.routes];
        this.run(routes)

    }

    async portTests() {
        console.log(await this.getFreePort())
        console.log(await this.getFreePort())
        console.log(await this.getFreePort())
    }

}