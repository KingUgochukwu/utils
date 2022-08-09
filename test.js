const edges = [
  ["A", 16, "B"],
  ["A", 12, "C"],
  ["A", 21, "D"],
  ["B", 16, "A"],
  ["B", 17, "D"],
  ["B", 20, "E"],
  ["C", 12, "A"],
  ["C", 28, "D"],
  ["C", 31, "F"],
  ["D", 21, "A"],
  ["D", 17, "B"],
  ["D", 28, "C"],
  ["D", 18, "E"],
  ["D", 19, "F"],
  ["D", 23, "G"],
  ["E", 11, "G"],
  ["E", 18, "D"],
  ["E", 20, "B"],
  ["F", 19, "D"],
  ["F", 31, "C"],
  ["F", 27, "G"],
  ["G", 23, "D"],
  ["G", 11, "E"],
  ["G", 27, "F"],
];

let minimum_spanning_tree = new Map();
let result = [];
minimum_spanning_tree.set("A", { vertice: "B", weight: 16 });
let foundVertices = ["A"];
let foundLinks = ["AB"];

function filterArray(foundVertices) {
  let arrayOfInterest = edges.filter((edge) => {
    return foundVertices.includes(edge[0]) && !foundVertices.includes(edge[2]);
  });
  return arrayOfInterest;
}

function prims() {
  let run = true;
  while (run) {
    for (let i = 0; i < foundVertices.length; i++) {
      const element = foundVertices[i];
      let filteredArray = filterArray(foundVertices);
      let smallest = filteredArray.sort((a, b) => a[1] - b[1])[0];
      if (smallest) {
        foundVertices.push(smallest[2]),
          minimum_spanning_tree.set(smallest[0], {
            vertice: smallest[2],
            weight: smallest[1],
          });
        result.push(smallest);
      } else {
        console.log(result);
        run = false;
        break;
      }
    }
  }
}

prims();
