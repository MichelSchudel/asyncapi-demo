const fs = require('fs');
const path = require('path');

/**
 * @asyncapi/generator's React file writer never creates missing directories before writing
 * (it calls plain fs.writeFile) - it only "works" when the target directory already exists.
 * javaSourceRoot/resourcesRoot are usually brand new multi-level paths (e.g.
 * target/generated-sources/asyncapi-template/nl/craftsmen/...), so we create them ourselves
 * before rendering starts.
 */
function packagePath(javaPackage) {
  return javaPackage.replace(/\./g, '/');
}

module.exports = {
  'generate:before': (generator) => {
    const { javaPackage, messagingPackage, javaSourceRoot, resourcesRoot } = generator.templateParams;

    [
      path.join(generator.targetDir, javaSourceRoot, packagePath(javaPackage)),
      path.join(generator.targetDir, javaSourceRoot, packagePath(messagingPackage)),
      path.join(generator.targetDir, resourcesRoot),
    ].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
  },
};
