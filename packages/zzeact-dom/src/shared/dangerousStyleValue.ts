import { isUnitlessNumber } from './CSSProperty'

function dangerousStyleValue(name, value, isCustomProperty?: boolean): string {
  const isEmpty = value == null || typeof value === 'boolean' || value === ''
  if (isEmpty) {
    return ''
  }

  if (
    !isCustomProperty &&
    typeof value === 'number' &&
    value !== 0 &&
    !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])
  ) {
    return value + 'px'
  }

  return ('' + value).trim()
}

export default dangerousStyleValue
