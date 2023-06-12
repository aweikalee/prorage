const SIGN = Date.now()
const LEFT_MARK = `__${SIGN}`
const RIGHT_MARK = `${SIGN}__`
const REGEXP = new RegExp(`"${LEFT_MARK}(.*?)${RIGHT_MARK}"`, 'g')

function mark(text: string) {
  return `${LEFT_MARK}${text}${RIGHT_MARK}`
}

function unmark(text: string) {
  return text.replace(REGEXP, '$1')
}

function jsReplacer(_: string, value: unknown) {
  switch (typeof value) {
    case 'undefined':
      return mark('undefined')
    case 'function':
      return mark('<Function>')
    case 'number':
      if (Number.isNaN(value)) return mark('NaN')
      if (value === Infinity) return mark('Infinity')
      if (value === -Infinity) return mark('-Infinity')
      return value
    case 'symbol':
      return mark(value.toString())
    case 'bigint':
      return mark(`${value}n`)
    default:
      return value
  }
}

function createCircularReplacer() {
  const stack: unknown[] = []
  const keys: string[] = []

  function circulerText(_: string, value: unknown) {
    const valueIndex = stack.indexOf(value)
    const path = keys.slice(0, valueIndex + 1)
    return mark(`<Circular ${path.join('.')}>`)
  }

  return function (this: any, key: string, value: unknown) {
    if (stack.length === 0) {
      stack.push(value)
      keys.push('~')
      return value
    }

    const thisIndex = stack.indexOf(this)
    if (~thisIndex) {
      stack.splice(thisIndex + 1)
      keys.splice(thisIndex + 1)
    } else {
      stack.push(this)
    }
    keys.push(key)

    const valueIndex = stack.indexOf(value)
    if (~valueIndex) return circulerText(key, value)

    return value
  }
}

function serializer(
  ...replacers: ((this: any, key: string, value: any) => any)[]
) {
  const _replacers = replacers.filter((replacer) => !!replacer)
  return function (this: any, key: string, value: any) {
    return _replacers.reduce((value, replacer) => {
      return replacer.call(this, key, value)
    }, value)
  }
}

export function jsStringify(
  value: any,
  replacer: (this: any, key: string, value: any) => any,
  space: number | string
) {
  const replacers = serializer(replacer, createCircularReplacer(), jsReplacer)
  const reuslt = JSON.stringify(value, replacers, space)
  return unmark(reuslt)
}
