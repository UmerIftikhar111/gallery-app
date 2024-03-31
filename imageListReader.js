const lineByLine = require('linebyline');
const path = require('path');

const readImageList = () => {
  const imageList = [];
  const rl = lineByLine(path.join(__dirname, 'imagelist.txt'));
  
  rl.on('line', (line) => {
    imageList.push(line.trim());
  });

  return imageList;
};

module.exports = {
  readImageList,
};
