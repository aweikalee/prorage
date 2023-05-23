import { describe, it, expect } from 'vitest'
import { createProrage, toRaw } from '../lib'

describe('plugins tests', () => {
  it('writer and reader', () => {
    const { storage: writer } = createProrage({
      plugins: [
        {
          writer(key, value) {
            return key === 'foo' ? 'bar' : value
          },
        },
      ],
    })

    writer.test = { foo: 'baz' }

    expect(localStorage.getItem('test')).toBe('{"foo":"bar"}')

    const { storage: reader } = createProrage({
      plugins: [
        {
          reader(key, value) {
            return key === 'foo' ? 'foo' : value
          },
        },
      ],
    })

    expect(reader.test).toStrictEqual({ foo: 'foo' })
  })

  it('setter and getter', () => {
    const { storage: setter } = createProrage({
      plugins: [
        {
          setter(key, value) {
            return key === 'foo' ? 'bar' : value
          },
        },
      ],
    })

    setter.test = { foo: 'baz' }

    expect(toRaw(setter.test)).toStrictEqual({ foo: 'bar' })
    expect(setter.test).toStrictEqual({ foo: 'bar' })

    const { storage: getter } = createProrage({
      plugins: [
        {
          getter(key, value) {
            return key === 'foo' ? 'foo' : value
          },
        },
      ],
    })

    expect(toRaw(setter.test)).toStrictEqual({ foo: 'bar' })
    expect(getter.test).toStrictEqual({ foo: 'foo' })
  })

  it('multiple plugins', () => {
    const order: string[] = []
    const { storage } = createProrage({
      plugins: [
        {
          writer(_, value) {
            order.push('one writer')
            return value
          },
          reader(_, value) {
            order.push('one reader')
            return value
          },
          getter(_, value) {
            order.push('one getter')
            return value
          },
          setter(_, value) {
            order.push('one setter')
            return value
          },
        },
        {
          writer(_, value) {
            order.push('two writer')
            return value
          },
          reader(_, value) {
            order.push('two reader')
            return value
          },
          getter(_, value) {
            order.push('two getter')
            return value
          },
          setter(_, value) {
            order.push('two setter')
            return value
          },
        },
      ],
    })

    storage.order
    storage.order = 1
    storage.order

    expect(order).toStrictEqual([
      'two reader',
      'one reader',
      'two getter',
      'one getter',

      'one setter',
      'two setter',
      'one writer',
      'two writer',

      'two getter',
      'one getter',
    ])
  })
})
