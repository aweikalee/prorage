import { describe, it, expect } from 'vitest'
import { reactive } from '@vue/reactivity'
import { watch, watchEffect } from '../lib'

describe('watch', () => {
  it('watchEffect', () => {
    const state = reactive({ count: 0 })
    let count: number | undefined
    watchEffect(() => {
      count = state.count
    })
    expect(count).toBe(0)

    state.count++
    expect(count).toBe(1)
  })

  it('watch', () => {
    const state = reactive({ count: 0 })
    let count = 0
    watch(
      () => state.count,
      () => {
        count += 1
      }
    )
    expect(count).toBe(0)

    state.count++
    expect(count).toBe(1)
  })

  it('watch flush: async', async () => {
    const state = reactive({ count: 0 })
    let count = 0
    watch(
      () => state.count,
      () => {
        count += 1
      },
      {
        flush: 'async',
      }
    )

    state.count++
    state.count++
    expect(count).toBe(0)
    await Promise.resolve()
    expect(count).toBe(1)
  })

  it('watch deep: true', () => {
    const state = reactive({ count: 0, obj: { count: 0 } })
    let count = 0
    watch(
      () => state,
      () => {
        count += 1
      },
      {
        deep: true,
      }
    )
    expect(count).toBe(0)

    state.count++
    expect(count).toBe(1)

    delete (state.obj as any).count
    expect(count).toBe(2)

    state.obj.count = 1
    expect(count).toBe(3)
  })

  it('watch immediate: true', () => {
    const state = reactive({ count: 0 })
    let called = false
    watch(
      () => state.count,
      () => {
        called = true
      },
      {
        immediate: true,
      }
    )
    expect(called).toBe(true)
  })
})
