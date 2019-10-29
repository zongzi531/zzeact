import { Fiber } from './ZzeactFiber'
import { StackCursor } from './ZzeactFiberStack'

import { isFiberMounted } from '@/zzeact-reconciler/reflection'
import { ClassComponent, HostRoot } from '@/shared/ZzeactWorkTags'
import getComponentName from '@/shared/getComponentName'
import invariant from '@/shared/invariant'

import { startPhaseTimer, stopPhaseTimer } from './ZzeactDebugFiberPerf'
import {createCursor /*, push */, pop} from './ZzeactFiberStack'

export const emptyContextObject = {}

// eslint-disable-next-line prefer-const
let contextStackCursor: StackCursor<object> = createCursor(emptyContextObject)
// eslint-disable-next-line prefer-const
let didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isContextProvider(type: Function & { childContextTypes: any }): boolean {
  const childContextTypes = type.childContextTypes
  return childContextTypes !== null && childContextTypes !== undefined
}

function popContext(/* fiber: Fiber */): void {
  pop(didPerformWorkStackCursor, /* fiber */)
  pop(contextStackCursor, /* fiber */)
}

function popTopLevelContextObject(/* fiber: Fiber */): void {
  pop(didPerformWorkStackCursor, /* fiber */)
  pop(contextStackCursor, /* fiber */)
}

function processChildContext(
  fiber: Fiber,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any,
  parentContext: object,
): object {
  const instance = fiber.stateNode
  const childContextTypes = type.childContextTypes

  if (typeof instance.getChildContext !== 'function') {
    return parentContext
  }

  let childContext
  startPhaseTimer(fiber, 'getChildContext')
  // eslint-disable-next-line prefer-const
  childContext = instance.getChildContext()
  stopPhaseTimer()
  // eslint-disable-next-line prefer-const
  for (let contextKey in childContext) {
    invariant(
      contextKey in childContextTypes,
      '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
      getComponentName(type) || 'Unknown',
      contextKey,
    )
  }

  return {...parentContext, ...childContext}
}

function findCurrentUnmaskedContext(fiber: Fiber): object {
  invariant(
    isFiberMounted(fiber) && fiber.tag === ClassComponent,
    'Expected subtree parent to be a mounted class component. ' +
      'This error is likely caused by a bug in zzeact. Please file an issue.',
  )

  let node = fiber
  do {
    switch (node.tag) {
      case HostRoot:
        return node.stateNode.context
      case ClassComponent: {
        const Component = node.type
        if (isContextProvider(Component)) {
          return node.stateNode.__zzeactInternalMemoizedMergedChildContext
        }
        break
      }
    }
    node = node.return
  } while (node !== null)
  invariant(
    false,
    'Found unexpected detached subtree parent. ' +
      'This error is likely caused by a bug in zzeact. Please file an issue.',
  )
}

export {
  // getUnmaskedContext,
  // cacheContext,
  // getMaskedContext,
  // hasContextChanged,
  popContext,
  popTopLevelContextObject,
  // pushTopLevelContextObject,
  processChildContext,
  isContextProvider,
  // pushContextProvider,
  // invalidateContextProvider,
  findCurrentUnmaskedContext,
}
