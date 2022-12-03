import { crossPlatformPath, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";

export class SourceMappingUrl {
  private readonly SOURCEMAPDES = '//# sourceMappingURL='

  static fixContent(absFilePath: string,
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
    return (new SourceMappingUrl(absFilePath
      // , content
    )).process();
  }

  private readonly content: string;
  private readonly contentLines: string[];
  private readonly mappingLineIndex: number;
  private constructor(
    private absFilePath: string,
    // private passedContent?: string
  ) {
    // console.log(`Fixging ${absFilePath}`, 1)
    // this.content = (passedContent ? passedContent : (Helpers.readFile(absFilePath)) || '');
    this.content = ((Helpers.readFile(absFilePath)) || '');
    this.contentLines = this.content.split(/\r?\n/);

    for (let index = (this.contentLines.length - 1); index >= 0; index--) {
      const line = this.contentLines[index];
      if (line.trim().startsWith(this.SOURCEMAPDES)) {
        this.mappingLineIndex = index;
        break;
      }
    }
  }

  process(): string {
    if (this.mappingLineIndex !== -1) {
      this.contentLines[this.mappingLineIndex] = `${this.SOURCEMAPDES}${path.basename(this.absFilePath)}.map`;
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
