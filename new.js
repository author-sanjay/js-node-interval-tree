const IntervalTree = require('node-interval-tree');

const tree = new IntervalTree();

// Add two adjacent intervals
tree.insert([1, 2]);
tree.insert([2, 3]);

// Find the adjacent intervals
const intervals = tree.search(1, 3);

if (intervals.length === 2) {
  // Remove the two intervals
  tree.remove(intervals[0]);
  tree.remove(intervals[1]);

  // Merge the two intervals
  const merged = [intervals[0].low, intervals[1].high];

  // Add the merged interval back to the tree
  tree.insert(merged);
}
