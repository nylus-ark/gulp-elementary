let gulp = require("gulp"),
  sass = require("gulp-sass"),
  autoprefixer = require("gulp-autoprefixer"),
  cleanCSS = require("gulp-clean-css"),
  babel = require("gulp-babel"),
  uglify = require("gulp-uglify"),
  del = require("del"),
  browserSync = require("browser-sync"),
  fileinclude = require("gulp-file-include"),
  fs = require("fs-extra"),
  path = require("path");

sass.compiler = require("node-sass"); // Переназначаем компилирование

// Функция для корректной работы с путями
function pathJ(value) {
  return path.join(__dirname, value);
}
// Название папки с итоговым проектом
const finalFolder = "dest";

// Функция обработки html файлов
function html(src, dest) {
  return gulp
    .src(src)
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: pathJ("src/components")
      }).on("error", function(error) {
        console.error(error);
      })
    )
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }));
}
// Функция обработки scss файлов
function scss(src, dest) {
  return gulp
    .src(src)
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false
      })
    )
    .pipe(
      cleanCSS({
        level: 2
      })
    )
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }));
}
// Функция обработки js файлов
function js(src, dest) {
  return gulp
    .src(src)
    .pipe(
      babel({
        presets: ["@babel/env"]
      })
    )
    .pipe(
      uglify({ toplevel: true }).on("error", function() {
        this.emit("end");
      })
    )
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }));
}
// Функция обработки шрифтов
function fonts(src, dest) {
  fs.copy(src, dest);
  // TODO: нужно сделать оптимизацию шрифтов
}
// Функция обработки картинок
function img(src, dest) {
  fs.copy(src, dest);
  // TODO: нужно сделать оптимизацию картинок
}

// Функция сборки проекта
async function buildProject() {
  // Очистка папки "build"
  await del([pathJ(`${finalFolder}/*`)]);

  // Обработка всех страниц (html, scss, js)
  const arrayPages = fs.readdirSync(pathJ("src/pages"));
  let pathBuild = "";
  for (let folder of arrayPages) {
    folder === "main"
      ? (pathBuild = pathJ(`${finalFolder}`))
      : (pathBuild = pathJ(`${finalFolder}/pages/${folder}`));

    const pathFolder = pathJ(`src/pages/${folder}`);
    for (let file of fs.readdirSync(pathFolder)) {
      const fileName = `${pathFolder}/${file}`;

      switch (path.extname(fileName)) {
        case ".html":
          html(fileName, pathBuild);
          break;
        case ".scss":
          scss(fileName, pathBuild);
          break;
        case ".js":
          js(fileName, pathBuild);
          break;
      }
    }
  }

  // Обработка стилей компонентов
  scss(pathJ("src/components/common.scss"), pathJ(finalFolder));
  // Обработка картинок
  img(pathJ("src/static/images"), pathJ(`${finalFolder}/static/images`));
  // Обработка шрифтов
  fonts(pathJ("src/static/fonts"), pathJ(`${finalFolder}/static/fonts`));
}

// Функция которая слушает изменения файлов в проекте
function watch() {
  browserSync.init({
    server: {
      baseDir: pathJ(finalFolder)
    }
  });
  // При изменении любого типа файлов пересобрать проект
  gulp.watch(pathJ("src/**/*.*"), buildProject);
}
gulp.task("watch", watch);

// Сборка проекта
gulp.task("build", buildProject);
// Режим разработки
gulp.task("start", gulp.series("build", "watch"));
