declare module '*.json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any
  export default value
  export const version: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let MSApp: any

// Zzeact$Element<any>
type Zzeact$Element = {
  $$typeof: symbol | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _owner: any
}

// Zzeact$Component<T, P>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Zzeact$Component = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Zzeact$ElementType = any

type possibleHasDefault<T> = T & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type mixed = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyntheticEvent = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TimeoutID = any
