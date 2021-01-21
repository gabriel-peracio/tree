import isMatch from "lodash/isMatch";

export type serializedTree<T> = T & {
  children?: Array<serializedTree<T>>;
};

export class Tree<T> {
  key: string;
  children?: {
    [key: string]: Tree<T>;
  };
  data: T;
  parent?: Tree<T>;
  constructor(props: serializedTree<T>, parent?: Tree<T>) {
    this.data = props;
    if (parent) {
      this.parent = parent;
      this.key = `${parent.getNextChildKey()}`;
    } else {
      this.key = "0";
    }
    if (props.children) {
      this.children = {};
      props.children?.forEach((child) => {
        const newChild = new Tree(child, this);
        this.children![newChild.key] = newChild;
      });
    }
  }
  /**
   * Looks through the descendants until it finds a node whose key matches the one provided
   * The node may return itself if the key matches
   * @param key the key
   */
  get(key: string): Tree<T> | undefined {
    if (this.key === key) return this;
    return this.descendants.find((node) => node.key === key);
  }

  get isRoot(): boolean {
    return !this.parent;
  }

  /**
   * Returns the depth of the current node relative to the root
   */
  get depth() {
    let depth = 0;
    let node: Tree<T> = this;
    while (node.parent) {
      depth++;
      node = node.parent;
    }
    return depth;
  }

  /**
   * Returns the root node of the tree this node is attached to
   */
  get rootNode() {
    let node: Tree<T> = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  get childrenList() {
    if (!this.children) {
      return [];
    }
    return Object.values(this.children);
  }

  get ancestors() {
    let ancestors = [];
    let node: Tree<T> = this;
    while (node.parent) {
      ancestors.push(node.parent);
      node = node.parent;
    }
    return ancestors;
  }

  get descendants() {
    if (!this.children) {
      return [];
    }
    let descendants: Array<Tree<T>> = [];
    Object.values(this.children).forEach((child) => {
      descendants.push(child);
      descendants = descendants.concat(child.descendants);
    });
    return descendants;
  }

  get siblings() {
    if (!this.parent) {
      return [];
    }
    const nodeList = Object.assign({}, this.parent.children!);
    delete nodeList[this.key];
    return nodeList;
  }

  /**
   * Gets the value of the `indexer` attribute of the current node and all its ancestors, and puts
   * them in an array, thus forming a "path"
   * @param indexer the name of an attribute of a node
   * @param includeRoot whether the root element should be included in the path
   *
   * @example
   * ```
   * myCategoryNode.getPath('categoryName',false); // returns ['office', 'furniture', 'chairs']
   * ```
   */
  getPath(indexer: keyof T, includeRoot: boolean = false) {
    const ancestors = this.ancestors;
    if (!includeRoot) {
      ancestors.pop();
    }
    ancestors.reverse();
    const path = ancestors.map((a) => a.data[indexer]);

    path.push(this.data[indexer]);
    return path;
  }

  findAllChildren(predicate: Partial<Tree<Partial<T>>>): Array<Tree<T>> {
    return this.childrenList.filter((node) => isMatch(node, predicate));
  }

  findAllDescendants(predicate: Partial<Tree<Partial<T>>>): Array<Tree<T>> {
    return this.descendants.filter((node) => isMatch(node, predicate));
  }

  findOneDescendant(predicate: Partial<Tree<Partial<T>>>): Tree<T> | undefined {
    const result = this.findAllDescendants(predicate);
    if (result.length) {
      return result[0];
    }
  }

  hasChildren(): Boolean {
    return !!this.children;
  }

  findOneChild(predicate: Partial<Tree<Partial<T>>>): Tree<T> | undefined {
    const result = this.findAllChildren(predicate);
    if (result.length) {
      return result[0];
    }
  }

  appendChild(nodeData: serializedTree<T>): Tree<T> {
    const childNode = new Tree(nodeData, this);
    if (this.children) {
      this.children[childNode.key] = childNode;
    } else {
      this.children = { [childNode.key]: childNode };
    }
    return childNode;
  }

  getNextChildKey() {
    if (!this.children || Object.keys(this.children).length === 0) {
      return `${this.key}.0`;
    } else {
      const childKeys = Object.keys(this.children);
      const lastKey = childKeys[childKeys.length - 1];
      const keyArray = lastKey.split(".").map((k) => parseInt(k, 10));
      keyArray[keyArray.length - 1]++;
      return keyArray.join(".");
    }
  }

  traverse(callback: (node: Tree<T>) => void) {
    callback(this);
    if (this.children) {
      Object.values(this.children).forEach((child) => {
        child.traverse(callback);
      });
    }
  }

  serialize(): serializedTree<T> {
    if (!this.children) {
      return this.data;
    } else {
      return {
        ...this.data,
        children: Object.values(this.children).map((child) =>
          child.serialize()
        ),
      };
    }
  }
}
