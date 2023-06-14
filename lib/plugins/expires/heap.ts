export class Heap<T> {
  protected list: T[] = []

  constructor(
    private compare: (a: T, b: T) => boolean,
    private equal: (a: T, b: T) => boolean
  ) {}

  insert(target: T) {
    this.remove(target)

    const findIndex = this.list.findIndex((item) => {
      return this.compare(target, item)
    })

    if (~findIndex) {
      this.list.splice(findIndex, 0, target)
    } else {
      this.list.push(target)
    }
  }

  findIndex(target: T) {
    return this.list.findIndex((item) => this.equal(target, item))
  }

  remove(target: T) {
    const index = this.findIndex(target)
    if (~index) this.list.splice(index, 1)
  }

  clear() {
    this.list.length = 0
  }
}
