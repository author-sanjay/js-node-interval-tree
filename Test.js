const moment = require("moment");
const monitor = require("nodemon/lib/monitor");

class IntervalTree {
  constructor() {
    this.root = null;
  }

  insert([start, end]) {
    if (this.root === null) {
      this.root = new Node(start, end);
      return;
    }

    let node = this.root;
    let parent;
    const overlapping = this.search(start, end);

    if (overlapping.length == 0) {
      while (true) {
        parent = node;
        if (moment(start).seconds(0).milliseconds(0).isBefore(node.min)) {
          node = node.left;
          if (node === null) {
            parent.left = new Node(start, end);
            break;
          }
        } else if (moment(end).seconds(0).milliseconds(0).isAfter(node.max)) {
          node = node.right;
          if (node === null) {
            parent.right = new Node(start, end);
            break;
          }
        } else {
          if (
            moment(start).isBefore(node.max) &&
            moment(end).isAfter(node.min)
          ) {
            console.log("overlapping");
            console.log(start, end);
            break;
          } else if (moment(end).isSame(node.min)) {
            node.min = start;
            break;
          } else if (moment(start).isSame(node.max)) {
            node.max = end;
            break;
          } else if (moment(start).isAfter(node.max) && node.right === null) {
            node.right = new Node(start, end);
            break;
          } else if (moment(end).isBefore(node.min) && node.left === null) {
            node.left = new Node(start, end);
            break;
          } else {
            node = node.right;
          }
        }
      }
    } else {
      console.log("Overlapping");
    }

    this.mergeIntervals();
  }

  mergeIntervals() {
    const merged = [];
    this._mergeIntervals(this.root, merged);
    this.root = merged[0] || null;
  }

  _mergeIntervals(node, merged) {
    if (!node) {
      return;
    }

    this._mergeIntervals(node.left, merged);

    if (merged.length > 0) {
      const last = merged[merged.length - 1];
      if (moment(node.min).isSameOrBefore(moment(last.max))) {
        last.max = moment.max(last.max, node.max);
        return;
      }
    }

    merged.push(new Node(moment(node.min), moment(node.max)));

    this._mergeIntervals(node.right, merged);
  }

  search(min, max) {
    let result = [];
    let stack = [];
    let node = this.root;

    while (node !== null || stack.length > 0) {
      if (node !== null) {
        stack.push(node);
        node = node.left;
      } else {
        node = stack.pop();
        if (moment(max).isAfter(node.min) && moment(min).isBefore(node.max)) {
          result.push([moment(node.min).format(), moment(node.max).format()]);
        }
        node = node.right;
      }
    }

    return result;
  }

  getIntervals() {
    const intervals = [];

    function traverse(node) {
      if (node === null) {
        return;
      }

      if (node.left !== null) {
        traverse(node.left);
      }

      intervals.push([moment(node.min).format(), moment(node.max).format()]);

      if (node.right !== null) {
        traverse(node.right);
      }
    }

    traverse(this.root);

    return intervals;
  }

  deleteInterval(start1, end1) {
    this.root = this._deleteInterval(this.root, start1, end1);
    console.log(this.root);
  }

  _deleteInterval(node, start1, end1) {
    if (node === null) {
      return node;
    }

    if (moment(start1).isSame(node.min) && moment(end1).isSame(node.max)) {
      if (node.left === null && node.right === null) {
        return null;
      }
      if (node.left === null) {
        node = node.right;
        return node;
      }
      if (node.right === null) {
        node = node.left;
        return node;
      }
      let temp = this._findMinNode(node.right);
      node.min = temp.min;
      node.max = temp.max;
      node.right = this._deleteInterval(node.right, temp.min, temp.max);
      return node;
    }

    if (moment(start1).isSame(node.min) && moment(end1).isBefore(node.max)) {
      let end = node.max;
      node.min = end1;
      node.max = end;
      this.insert([end1, end]);
      return node;
    }

    if (moment(start1).isAfter(node.min) && moment(end1).isSame(node.max)) {
      let start = node.min;
      node.min = start;
      node.max = start1;
      this.insert([start, start1]);
      return node;
    }

    if (moment(start1).isAfter(node.min) && moment(end1).isBefore(node.max)) {
      let start = node.min;
      let end = node.max;
      node.min = start;
      node.max = start1;
      this.insert([start, start1]);
      this.insert([end1, end]);
      return node;
    }

    node.left = this._deleteInterval(node.left, start1, end1);
    node.right = this._deleteInterval(node.right, start1, end1);
    return node;
  }

  _deleteNode(node) {
    if (node.left === null && node.right === null) {
      // Case 1: Node has no children
      return null;
    } else if (node.left === null) {
      // Case 2: Node has one child (right child)
      return node.right;
    } else if (node.right === null) {
      // Case 2: Node has one child (left child)
      return node.left;
    } else {
      // Case 3: Node has two children
      let successor = this._findSuccessor(node);
      node.min = successor.min;
      node.max = successor.max;
      node.right = this._deleteInterval(
        node.right,
        successor.min,
        successor.max
      );
      return node;
    }
  }

  _findSuccessor(node) {
    let current = node.right;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  _findMinNode(node) {
    while (node.left != null) {
      node = node.left;
    }
    return node;
  }

  _findMaxNode(node) {
    while (node.right !== null) {
      node = node.right;
    }
    return node;
  }

  updateInterval(start1, end1, start2, end2) {
    const before = this.search(
      moment(start1).subtract(5, "seconds").format("YYYY-MM-DD HH:mm:ss"),
      moment(start1).subtract(1, "seconds").format("YYYY-MM-DD HH:mm:ss")
    );
    const after = this.search(
      moment(end1).add(1, "seconds").format("YYYY-MM-DD HH:mm:ss"),
      moment(end1).add(5, "seconds").format("YYYY-MM-DD HH:mm:ss")
    );
    console.log(before, after);
    if (before.length == 0 && after.length == 0) {
      this.deleteInterval([start1, end1]);
      this.insert([start2, end2]);
    }
  }

  mergeIntervals() {
    let stack = [];
    let node = this.root;

    while (node !== null || stack.length > 0) {
      if (node !== null) {
        stack.push(node);
        node = node.left;
      } else {
        node = stack.pop();
        if (node.right !== null) {
          if (moment(node.max).isSameOrAfter(moment(node.right.min))) {
            node.max = moment
              .max([moment(node.max), moment(node.right.max)])
              .toDate();
            node.min = moment
              .min([moment(node.min), moment(node.right.min)])
              .toDate();
            node.right = node.right.right;
            stack.push(node); // check again with next node in stack
          }
        }
        if (node.left !== null) {
          if (moment(node.left.max).isSameOrAfter(moment(node.min))) {
            node.min = moment
              .min([moment(node.min), moment(node.left.min)])
              .toDate();
            node.left = node.left.left;
          }
        }
        node = node.right;
      }
    }
  }

  findNextNode(node) {
    let parent = null;
    while (node.left !== null) {
      parent = node;
      node = node.left;
    }
    return [moment(node.min), moment(node.max), parent];
  }

  insertt(interval) {
    const [start, end] = interval;
    const node = new Node(moment(start), moment(end));

    this.root = this._inserttNode(this.root, node);
  }

  _inserttNode(node, newNode) {
    if (node === null) {
      return newNode;
    }

    if (newNode.min.isBefore(node.min)) {
      node.left = this._inserttNode(node.left, newNode);
    } else {
      node.right = this._inserttNode(node.right, newNode);
    }

    return node;
  }
}
class Node {
  constructor(min, max) {
    this.min = min;
    this.max = max;
    this.left = null;
    this.right = null;
  }
}

// Create a new interval tree
const tree = new IntervalTree();
tree.insert([moment("11:00 am", "hh:mm a"), moment("12:00 pm", "hh:mm a")]);
// console.log(
//   tree.search(moment("09:30 am", "hh:mm a"), moment("11:01 am", "hh:mm a"))
// );
tree.insert([moment("09:30 am", "hh:mm a"), moment("11:00 am", "hh:mm a")]);

tree.deleteInterval(
  moment("09:40 am", "hh:mm a"),
  moment("11:30 am", "hh:mm a")
);

// tree.insert([moment('01:00 pm', 'hh:mm a'), moment('03:00 pm', 'hh:mm a')]);
// tree.insert([moment('04:00 pm', 'hh:mm a'), moment('05:00 pm', 'hh:mm a')]);

console.log(tree.getIntervals());
// tree.deleteInterval([moment('10:00 am', 'hh:mm a'), moment('11:00 am', 'hh:mm a')]);
// console.log(tree.getIntervals());
