import { config } from "tnp-config/src";
import { Helpers } from "tnp-helpers/src";
import { Project } from "../../project/abstract/project";

export async function $BRANDING(args: string, exit = true) {

  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

  if (proj.isStandaloneProject || proj.isSmartContainerChild || proj.isSmartContainerTarget) {
    await proj.branding.apply(true);
    Helpers.info('DONE');
  } else {
    Helpers.error(`Please specify child project name for branding process:
    ${config.frameworkName} branding my-container-child
    ${config.frameworkName} branding # inside standalone project
    `, false, true)
  }

  if (exit) {
    process.exit(0);
  }

}

async function $BRAND(args) {
  await $BRANDING(args)
}

export default {
  $BRANDING: Helpers.CLIWRAP($BRANDING, '$BRANDING'),
  $BRAND: Helpers.CLIWRAP($BRAND, '$BRAND'),
}
