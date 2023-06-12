import { createApp, h, toRaw } from 'vue'
import { jsStringify } from './stringify'
import { storage } from './storage'

window.storage = storage

createApp({
  render() {
    return h('div', [
      h('p', 'Open Console, Try The "window.storage".'),

      h('h2', 'Proxy'),
      h(
        'pre',
        jsStringify(storage, (_, value) => value, 2)
      ),

      h('h2', 'Original'),
      h(
        'pre',
        jsStringify({ ...storage }, (_, value) => toRaw(value), 2)
      ),
    ])
  },
}).mount('#app')
