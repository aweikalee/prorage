import { describe, it, expect, beforeEach } from 'vitest'
import { createStorage, PluginOptions } from '../lib'

describe('plugin', () => {
  let storage: any
  const history: string[] = []
  beforeEach(() => {
    history.length = 0
    storage = createStorage({
      saveFlush: 'sync',
      plugins: [createPlugin('1', history), () => createPlugin('2', history)],
    })
  })

  it('write', () => {
    storage.foo = 'bar'
    expect(history).toEqual([
      // createNamespace trigger
      '2 beforeParse',
      '1 beforeParse',
      '2 afterParse',
      '1 afterParse',

      // set trigger
      '1 set',
      '2 set',
      '1 beforeStringify',
      '2 beforeStringify',
      '1 stringify',
      '2 stringify',
      '1 afterStringify',
      '2 afterStringify',

      // undefinedPlugin trigger
      '2 get',
      '1 get',
    ])
  })

  it('read', () => {
    storage.foo
    expect(history).toEqual([
      // createNamespace trigger
      '2 beforeParse',
      '1 beforeParse',
      '2 parse',
      '1 parse',
      '2 afterParse',
      '1 afterParse',

      // get trigger
      '2 get',
      '1 get',
    ])

    history.length = 0
    storage.foo
    expect(history).toEqual([
      // get trigger
      '2 get',
      '1 get',
    ])
  })

  it('delete', () => {
    delete storage.foo
    expect(history).toEqual([
      // createNamespace trigger
      '2 beforeParse',
      '1 beforeParse',
      '2 parse',
      '1 parse',
      '2 afterParse',
      '1 afterParse',

      // delete trigger
      '1 deleteProperty',
      '2 deleteProperty',
      '1 beforeStringify',
      '2 beforeStringify',
      '1 stringify',
      '2 stringify',
      '1 afterStringify',
      '2 afterStringify',

      // undefinedPlugin trigger
      '2 get',
      '1 get',
    ])

    storage.foo = 'bar'
    history.length = 0
    delete storage.foo
    expect(history).toEqual([
      // delete trigger
      '1 deleteProperty',
      '2 deleteProperty',
      '1 beforeStringify',
      '2 beforeStringify',
      '1 stringify',
      '2 stringify',
      '1 afterStringify',
      '2 afterStringify',

      // undefinedPlugin trigger
      '2 get',
      '1 get',
    ])
  })

  it('write object', () => {
    storage.foo = { bar: 'bar' }
    expect(history).toEqual([
      // createNamespace trigger
      '2 beforeParse',
      '1 beforeParse',
      '2 afterParse',
      '1 afterParse',

      // set
      '1 set',
      '2 set',
      '1 beforeStringify',
      '2 beforeStringify',
      '1 stringify',
      '2 stringify',
      '1 stringify',
      '2 stringify',
      '1 afterStringify',
      '2 afterStringify',

      // undefinedPlugin trigger
      '2 get',
      '1 get',
    ])

    history.length = 0
    storage.foo.bar = 'baz'
    expect(history).toEqual([
      // get foo
      '2 get',
      '1 get',

      // set foo.bar
      '1 set',
      '2 set',
      '1 beforeStringify',
      '2 beforeStringify',
      '1 stringify',
      '2 stringify',
      '1 stringify',
      '2 stringify',
      '1 afterStringify',
      '2 afterStringify',

      // undefinedPlugin trigger
      '2 get',
      '1 get',
    ])
  })
})

function createPlugin(name: string, history: string[]): PluginOptions {
  return {
    beforeStringify() {
      history.push(`${name} beforeStringify`)
    },
    stringify(_, value) {
      history.push(`${name} stringify`)
      return value
    },
    afterStringify() {
      history.push(`${name} afterStringify`)
    },

    beforeParse() {
      history.push(`${name} beforeParse`)
    },
    parse(_, value) {
      history.push(`${name} parse`)
      return value
    },
    afterParse() {
      history.push(`${name} afterParse`)
    },

    get(_, __, value) {
      history.push(`${name} get`)
      return value
    },
    set(_, __, value) {
      history.push(`${name} set`)
      return value
    },
    deleteProperty() {
      history.push(`${name} deleteProperty`)
    },
  }
}
