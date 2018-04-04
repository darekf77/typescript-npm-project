import * as path from 'path';
import { watcher } from "./process";
import {
    Connection,
    PrimaryGeneratedColumn,
    Entity, Column,
    CreateDateColumn,
    createConnection,
    getRepository,
    Repository
} from "typeorm";

export { Repository, getRepository } from 'typeorm'

@Entity(TnpProcess.name)
export class TnpProcess {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {
        length: 1000,
        unique: true
    })
    uniqueName: string;

    @Column('boolean', {
        default: false
    })
    runAgain: boolean;

    @CreateDateColumn()
    created: Date;

}


export class RepoTnpProcess extends Repository<TnpProcess> {

    async reRunProcess(uniqueName: boolean) {
        await this.manager.transaction<TnpProcess>(async transactionalEntityManager => {
            let p = await transactionalEntityManager.createQueryBuilder(TnpProcess.name, 'tnp_process')
                .where("tnp_process.uniqueName = :uniqueName", { uniqueName })
                .getOne();
            if (!p) {
                const proc = transactionalEntityManager.create({ uniqueName })
                p = await transactionalEntityManager.save(proc);

            } else {
                p.runAgain = true;
                await transactionalEntityManager.save(p);
            }
            return p;;
        });
    }

    async


}



export class WatchNoRace {

    private constructor() {

    }

    public static __instance: WatchNoRace;
    public static get Instance() {
        if (!WatchNoRace.__instance) {
            WatchNoRace.__instance = new WatchNoRace();
        }
        return WatchNoRace.__instance;
    }


    connection: Connection;

    get repo() {
        return {
            TnpProcess: this.connection.getRepository(TnpProcess)
        };
    }

    getCodeTime(startTime: Date) {
        const endTime = new Date();
        console.log("Operation takes " + (endTime.getTime() - startTime.getTime()) + " milliseconds");
    }

    async connectToMemorySQL() {
        const startTime = new Date();
        try {
            const connection = await createConnection({
                entities: [TnpProcess],
                database: path.join(__dirname, '../tmp/tnp_db.sqlite3'),
                type: 'sqlite',
                synchronize: true,
                dropSchema: true,
                logging: false
            });
            this.connection = connection;
            console.log('Connected to db')
            this.getCodeTime(startTime);
        } catch (e) {
            console.log('ERROR while connecting to db', e)
            this.getCodeTime(startTime);
        }
    }

    async showProceses() {
        console.log('show processes')
        const all = await this.repo.TnpProcess.find()
        console.log('all', all)
    }

    async testData() {
        const self = this;
        async function u(n) {
            const data = self.repo.TnpProcess.create({ uniqueName: 'test' + n });
            await self.repo.TnpProcess.save(data);
        }
        await u(0)
        await u(1)
        await u(2)


    }

}





export async function initWatcherDB() {
    const w = WatchNoRace.Instance;
    try {
        await w.connectToMemorySQL();
        await w.testData()
        await w.showProceses()
    } catch (e) {
        console.log(e)
    }
    return w;
}