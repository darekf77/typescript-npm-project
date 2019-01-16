const gulp = require('gulp');
const _ = require('lodash');
const sass = require('node-sass');
const gutil = require('gulp-util');
const through = require('through2');
const inlineTemplates = require('gulp-inline-ng2-template');
const exec = require('child_process').exec;
import * as fs from 'fs';
import * as path from 'path';
import { ProjectFrom, config } from 'tnp-bundle'

/**
 * Inline templates configuration.
 * @see  https://github.com/ludohenin/gulp-inline-ng2-template
 */
const INLINE_TEMPLATES_DIST = {
  SRC: './components/**/*.ts',
  SRC_ASSETS: './components/**/*.png',
  DIST: './tmp/inlined-dist/src',
  CONFIG: {
    base: '/components',
    target: 'es6',
    useRelativePaths: true,
    styleProcessor: compileSass
  }
};

const INLINE_TEMPLATES_BUNDLE = _.cloneDeep(INLINE_TEMPLATES_DIST)
INLINE_TEMPLATES_BUNDLE.DIST = './tmp/inlined-bundle/src'

interface IsomorphicOptions {
  currentProjectName?: string;
  isWorkspaceChildProject: boolean;
  localIsomorphicLibsNames: string[];
}

function getIsomorphiOptions(): IsomorphicOptions {
  const project = ProjectFrom(process.cwd());
  if (project.isWorkspaceChildProject) {

    const workspace = project.parent;
    const localIsomorphicLibsNames = workspace.children
      .filter(c => c.type === 'isomorphic-lib')
      .map(c => c.name)
    return {
      currentProjectName: project.name,
      isWorkspaceChildProject: true,
      localIsomorphicLibsNames
    }

  }
  return {
    isWorkspaceChildProject: false,
    localIsomorphicLibsNames: []
  }
}


function replaceIsomprhicModules(options: IsomorphicOptions) {
  const { isWorkspaceChildProject, localIsomorphicLibsNames, currentProjectName } = options;
  console.log('localIsomorphicLibsNames', localIsomorphicLibsNames)
  return through.obj(function (file: File, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new gutil.PluginError(replaceIsomprhicModules.name.toUpperCase(), 'Streaming not supported'));
    }

    if (isWorkspaceChildProject) {
      let fileContent = file.contents.toString()
      localIsomorphicLibsNames.forEach(libname => {
        const regex = new RegExp(`${libname}\\/${config.folder.browser}\\/`, 'g')
        // console.log('regex source', regex.source)
        // console.log('replace Here ', fileContent)
        fileContent = fileContent.replace(regex, `${libname}/tmp-for-${currentProjectName}-${config.folder.browser}/`)
      })                // import { ... } from 'ss-common-logic/tmp-for-ss-common-ui-module'

      // console.log('write file here ', file.path)
      fs.writeFile(file.path, fileContent, {
        encoding: 'utf8'
      }, (err) => {
        if (err) {
          return cb(new gutil.PluginError(replaceIsomprhicModules.name.toUpperCase(), `Error during save of ${file.path}`));
        }
        process.nextTick(cb);
      })
    } else {
      process.nextTick(cb);
    }
  });
};



/**
 * Inline external HTML and SCSS templates into Angular component files.
 * @see: https://github.com/ludohenin/gulp-inline-ng2-template
 */
gulp.task('inline-templates-dist', ['copy-assets-dist'], () => {
  return gulp.src(INLINE_TEMPLATES_DIST.SRC)
    .pipe(inlineTemplates(INLINE_TEMPLATES_DIST.CONFIG))
    .pipe(gulp.dest(INLINE_TEMPLATES_DIST.DIST))
    // .pipe(replaceIsomprhicModules(getIsomorphiOptions()))
});

gulp.task('copy-assets-dist', () => {
  return gulp.src(INLINE_TEMPLATES_DIST.SRC_ASSETS)
    .pipe(gulp.dest(INLINE_TEMPLATES_DIST.DIST));
});

gulp.task('inline-templates-dist-watch', function () {
  gulp.watch('./components/**/*.*', ['inline-templates-dist']);
});

//#region bundle
gulp.task('inline-templates-bundle', ['copy-assets-bundle'], () => {
  return gulp.src(INLINE_TEMPLATES_BUNDLE.SRC)
    .pipe(inlineTemplates(INLINE_TEMPLATES_BUNDLE.CONFIG))
    .pipe(gulp.dest(INLINE_TEMPLATES_BUNDLE.DIST));
});

gulp.task('copy-assets-bundle', () => {
  return gulp.src(INLINE_TEMPLATES_DIST.SRC_ASSETS)
    .pipe(gulp.dest(INLINE_TEMPLATES_DIST.DIST));
});

gulp.task('inline-templates-bundle-watch', function () {
  gulp.watch('./components/**/*.*', ['inline-templates-bundle']);
});

//#endregion


//#region compile sass to css

/**
 * Compile SASS to CSS.
 * @see https://github.com/ludohenin/gulp-inline-ng2-template
 * @see https://github.com/sass/node-sass
 */
function compileSass(path, ext, file, callback) {
  let compiledCss = sass.renderSync({
    file: path,
    outputStyle: 'compressed',
  });
  callback(null, compiledCss.css);
}
//#endregion


//#region file interface

export interface File {
  /**
   * Gets and sets the contents of the file. If set to a `Stream`, it is wrapped in
   * a `cloneable-readable` stream.
   *
   * Throws when set to any value other than a `Stream`, a `Buffer` or `null`.
   */
  contents: Buffer | NodeJS.ReadableStream | null;

  /**
   * Gets and sets current working directory. Will always be normalized and have trailing
   * separators removed.
   *
   * Throws when set to any value other than non-empty strings.
   */
  cwd: string;

  //
  /**
   * Gets and sets base directory. Used for relative pathing (typically where a glob starts).
   * When `null` or `undefined`, it simply proxies the `file.cwd` property. Will always be
   * normalized and have trailing separators removed.
   *
   * Throws when set to any value other than non-empty strings or `null`/`undefined`.
   *
   * The setter's type is actually `string | null | undefined`, but TypeScript doesn't allow
   * get/set accessors to be of different type. The property is declared as `string` for the
   * compiler not to require useless null checks for the getter. (Hopefully, noone will need
   * to assign `null` to this property.)
   */
  base: string;

  /**
   * Gets and sets the absolute pathname string or `undefined`. Setting to a different value
   * appends the new path to `file.history`. If set to the same value as the current path, it
   * is ignored. All new values are normalized and have trailing separators removed.
   *
   * Throws when set to any value other than a string.
   *
   * The getter is actually of type `string | undefined` whereas the setter is just `string`,
   * however TypeScript doesn't allow get/set accessors to be of different type. See the
   * comment for the `base` properties.
   */
  path: string;

  /**
   * Array of `file.path` values the Vinyl object has had, from `file.history[0]` (original)
   * through `file.history[file.history.length - 1]` (current). `file.history` and its elements
   * should normally be treated as read-only and only altered indirectly by setting `file.path`.
   */
  readonly history: ReadonlyArray<string>;

  /**
   * Gets the result of `path.relative(file.base, file.path)`.
   *
   * Throws when set or when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.relative); // file.js
   * ```
   */
  relative: string;

  /**
   * Gets and sets the dirname of `file.path`. Will always be normalized and have trailing
   * separators removed.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.dirname); // /test
   *
   * file.dirname = '/specs';
   *
   * console.log(file.dirname); // /specs
   * console.log(file.path); // /specs/file.js
   * ```
   */
  dirname: string;

  /**
   * Gets and sets the basename of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.basename); // file.js
   *
   * file.basename = 'file.txt';
   *
   * console.log(file.basename); // file.txt
   * console.log(file.path); // /test/file.txt
   * ```
   */
  basename: string;

  /**
   * Gets and sets stem (filename without suffix) of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.stem); // file
   *
   * file.stem = 'foo';
   *
   * console.log(file.stem); // foo
   * console.log(file.path); // /test/foo.js
   * ```
   */
  stem: string;

  /**
   * Gets and sets extname of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.extname); // .js
   *
   * file.extname = '.txt';
   *
   * console.log(file.extname); // .txt
   * console.log(file.path); // /test/file.txt
   * ```
   */
  extname: string;

  /**
   * Gets and sets the path where the file points to if it's a symbolic link. Will always
   * be normalized and have trailing separators removed.
   *
   * Throws when set to any value other than a string.
   */
  symlink: string | null;

  stat: fs.Stats | null;

  [customProperty: string]: any;

  /**
   * Returns `true` if the file contents are a `Buffer`, otherwise `false`.
   */
  isBuffer(): this is BufferFile;

  /**
   * Returns `true` if the file contents are a `Stream`, otherwise `false`.
   */
  isStream(): this is StreamFile;

  /**
   * Returns `true` if the file contents are `null`, otherwise `false`.
   */
  isNull(): this is NullFile;

  /**
   * Returns `true` if the file represents a directory, otherwise `false`.
   *
   * A file is considered a directory when:
   *
   * - `file.isNull()` is `true`
   * - `file.stat` is an object
   * - `file.stat.isDirectory()` returns `true`
   *
   * When constructing a Vinyl object, pass in a valid `fs.Stats` object via `options.stat`.
   * If you are mocking the `fs.Stats` object, you may need to stub the `isDirectory()` method.
   */
  isDirectory(): this is DirectoryFile;

  /**
   * Returns `true` if the file represents a symbolic link, otherwise `false`.
   *
   * A file is considered symbolic when:
   *
   * - `file.isNull()` is `true`
   * - `file.stat` is an object
   * - `file.stat.isSymbolicLink()` returns `true`
   *
   * When constructing a Vinyl object, pass in a valid `fs.Stats` object via `options.stat`.
   * If you are mocking the `fs.Stats` object, you may need to stub the `isSymbolicLink()` method.
   */
  isSymbolic(): this is SymbolicFile;

  /**
   * Returns a new Vinyl object with all attributes cloned.
   *
   * __By default custom attributes are cloned deeply.__
   *
   * If `options` or `options.deep` is `false`, custom attributes will not be cloned deeply.
   *
   * If `file.contents` is a `Buffer` and `options.contents` is `false`, the `Buffer` reference
   * will be reused instead of copied.
   */
  clone(opts?: { contents?: boolean, deep?: boolean } | boolean): this;

  /**
   * Returns a formatted-string interpretation of the Vinyl object.
   * Automatically called by node's `console.log`.
   */
  inspect(): string;

  /**
   * @deprecated This method was removed in v2.0.
   * If file.contents is a Buffer, it will write it to the stream.
   * If file.contents is a Stream, it will pipe it to the stream.
   * If file.contents is null, it will do nothing.
   */
  pipe<T extends NodeJS.WritableStream>(
    stream: T,
    opts?: {
      /**
       * If false, the destination stream will not be ended (same as node core).
       */
      end?: boolean;
    }): T;
}

// See https://github.com/Microsoft/TypeScript/issues/11796

interface BufferFile extends File {
  contents: Buffer;
  isStream(): this is never;
  isBuffer(): true;
  isNull(): this is never;
  isDirectory(): this is never;
  isSymbolic(): this is never;
}

interface StreamFile extends File {
  contents: NodeJS.ReadableStream;
  isStream(): true;
  isBuffer(): this is never;
  isNull(): this is never;
  isDirectory(): this is never;
  isSymbolic(): this is never;
}

interface NullFile extends File {
  contents: null;
  isStream(): this is never;
  isBuffer(): this is never;
  isNull(): true;
  isDirectory(): this is DirectoryFile;
  isSymbolic(): this is SymbolicFile;
}

interface DirectoryFile extends NullFile {
  isDirectory(): true;
  isSymbolic(): this is never;
}

interface SymbolicFile extends NullFile {
  isDirectory(): this is never;
  isSymbolic(): true;
}

//#endregion
