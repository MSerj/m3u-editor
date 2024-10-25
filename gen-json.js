const dirTree = require("directory-tree");
const fs = require("fs");

const tree = dirTree(
  "public/tvlogos",
  { extensions: /\.png/ },
  (item, PATH, stats) => {
    item.url = item.path.replace("public/", "https://m3u-editor.mserj.ru/");
  }
);
const jsonContent = JSON.stringify(tree.children);

fs.writeFile(
  "src/components/LogoAutocomplete.tvlogos.json",
  jsonContent,
  "utf8",
  function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }

    console.log("JSON file has been saved.");
  }
);
