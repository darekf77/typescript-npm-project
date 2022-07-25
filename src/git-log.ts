import { Helpers } from 'tnp-helpers';


async function run() {
  const gitlog = await Helpers.commnadOutputAsStringAsync('git log  HEAD~50');
  gitlog
    .split('\n')
    .filter(l => {
      return l.trim().startsWith('PLTB') || (l.trim().startsWith('PLTA')) ||
        l.trim().startsWith('[PLTB') || (l.trim().startsWith('[PLTA'));
    })

  console.log(gitlog);
  process.exit(0)
}

run()
