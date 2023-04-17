import { crossPlatformPath, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Project } from "../../abstract/project/project";

export class SourceMappingUrl {
  public static readonly SOURCEMAPDES = '//# sourceMappingURL='


  get isInRelaseBundle() {
    return this.projectWithBuild.location.includes('tmp-bundle-release/bundle');
  };

  static fixContent(absFilePath: string,
    projectWithBuild: Project,
    // content?: string
  ) {
    absFilePath = crossPlatformPath(absFilePath);
    if (
      !Helpers.exists(absFilePath)
      || Helpers.isFolder(absFilePath)
      || !absFilePath.endsWith('.js')
    ) {
      return;
    }
    return (new SourceMappingUrl(absFilePath, projectWithBuild
      // , content
    )).process();
  }

  private readonly content: string;
  private readonly contentLines: string[];
  private readonly mappingLineIndex: number;
  private constructor(
    private absFilePath: string,
    private projectWithBuild: Project,
    // private passedContent?: string
  ) {
    // console.log(`Fixging ${absFilePath}`, 1)
    // this.content = (passedContent ? passedContent : (Helpers.readFile(absFilePath)) || '');
    this.content = ((Helpers.readFile(absFilePath)) || '');
    this.contentLines = this.content.split(/\r?\n/);

    for (let index = (this.contentLines.length - 1); index >= 0; index--) {
      const line = this.contentLines[index];
      if (line.trim().startsWith(SourceMappingUrl.SOURCEMAPDES)) {
        this.mappingLineIndex = index;
        break;
      }
    }
  }

  process(): string {
    if (this.mappingLineIndex !== -1) {
      if (this.isInRelaseBundle || (process.platform !== 'win32')) { // TODO links on windows sucks d
        this.contentLines[this.mappingLineIndex] = `${SourceMappingUrl.SOURCEMAPDES}${path.basename(this.absFilePath)}.map`;
      }
    }
    const fixedContent = this.contentLines.join('\n');
    if (fixedContent !== this.content) {
      // if (!_.isNil(this.passedContent)) {
      //   return fixedContent;
      // }
      Helpers.writeFile(this.absFilePath, fixedContent);
    }
    return fixedContent;
  }


}
