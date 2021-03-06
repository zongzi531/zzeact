import { ZzeactNodeList } from '@/shared/ZzeactTypes'

import {
  FiberRoot,
  Batch as FiberRootBatch,
} from '@/zzeact-reconciler/src/ZzeactFiberRoot'


// import '../shared/checkZzeact'
import './ZzeactDOMClientInjection'

import {
  // computeUniqueAsyncExpiration,
  // findHostInstanceWithNoPortals,
  // updateContainerAtExpirationTime,
  // flushRoot,
  createContainer,
  updateContainer,
  // batchedUpdates,
  unbatchedUpdates,
  // interactiveUpdates,
  // flushInteractiveUpdates,
  // flushSync,
  // flushControlled,
  // injectIntoDevTools,
  getPublicRootInstance,
  // findHostInstance,
  // findHostInstanceWithWarning,
} from '@/zzeact-reconciler/inline.dom'

import {
  setRestoreImplementation,
  // enqueueStateRestore,
  // restoreStateIfNeeded,
} from '@/events/ZzeactControlledComponent'

import invariant from '@/shared/invariant'

import { restoreControlledState } from './ZzeactDOMComponent'

import {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType'

import { ROOT_ATTRIBUTE_NAME } from '../shared/DOMProperty'

// 这里有很多注入程序
setRestoreImplementation(restoreControlledState)

export type DOMContainer =
  | (HTMLElement & {
      _zzeactRootContainer?: Root
      _zzeactHasBeenPassedToCreateRootDEV?: boolean
    })
  | (HTMLDocument & {
      _zzeactRootContainer?: Root
      _zzeactHasBeenPassedToCreateRootDEV?: boolean
    })

type Batch = FiberRootBatch & {
  render(children: ZzeactNodeList): Work
  then(onComplete: () => mixed): void
  commit(): void
  _root: Root
  _hasChildren: boolean
  _children: ZzeactNodeList

  _callbacks: Array<() => mixed> | null
  _didComplete: boolean
}

type Root = {
  render(children: ZzeactNodeList, callback?: () => mixed): Work
  unmount(callback?: () => mixed): Work
  legacy_renderSubtreeIntoContainer(
    parentComponent: Zzeact$Component,
    children: ZzeactNodeList,
    callback?: () => mixed,
  ): Work
  createBatch(): Batch

  _internalRoot: FiberRoot
}

type Work = {
  then(onCommit: () => mixed): void
  _onCommit: () => void
  _callbacks: Array<() => mixed> | null
  _didCommit: boolean
}

function ZzeactWork(): void {
  this._callbacks = null
  this._didCommit = false
  this._onCommit = this._onCommit.bind(this)
}
ZzeactWork.prototype.then = function(onCommit: () => mixed): void {
  if (this._didCommit) {
    onCommit()
    return
  }
  let callbacks = this._callbacks
  if (callbacks === null) {
    callbacks = this._callbacks = []
  }
  callbacks.push(onCommit)
}
ZzeactWork.prototype._onCommit = function(): void {
  if (this._didCommit) {
    return
  }
  this._didCommit = true
  const callbacks = this._callbacks
  if (callbacks === null) {
    return
  }
  // TODO: Error handling.
  for (let i = 0; i < callbacks.length; i++) {
    const callback = callbacks[i]
    invariant(
      typeof callback === 'function',
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: %s',
      callback,
    )
    callback()
  }
}

function ZzeactRoot(
  container: DOMContainer,
  isConcurrent: boolean,
  hydrate: boolean,
): void {
  const root = createContainer(container, isConcurrent, hydrate)
  this._internalRoot = root
}
ZzeactRoot.prototype.render = function(
  children: ZzeactNodeList,
  callback?: () => mixed,
): Work {
  // 发现这里与 ZzeactRoot.prototype.legacy_renderSubtreeIntoContainer 功能相同则替换写法
  return this.legacy_renderSubtreeIntoContainer(null, children, callback)
}
ZzeactRoot.prototype.unmount = function(callback?: () => mixed): Work {
  const root = this._internalRoot
  const work = new ZzeactWork()
  callback = callback === undefined ? null : callback
  if (callback !== null) {
    work.then(callback)
  }
  updateContainer(null, root, null, work._onCommit)
  return work
}
ZzeactRoot.prototype.legacy_renderSubtreeIntoContainer = function(
  parentComponent: Zzeact$Component,
  children: ZzeactNodeList,
  callback?: () => mixed,
): Work {
  const root = this._internalRoot
  const work = new ZzeactWork()
  callback = callback === undefined ? null : callback
  if (callback !== null) {
    work.then(callback)
  }
  updateContainer(children, root, parentComponent, work._onCommit)
  return work
}
// ZzeactRoot.prototype.createBatch = function(): Batch {
//   const batch = new ZzeactBatch(this)
//   const expirationTime = batch._expirationTime

//   const internalRoot = this._internalRoot
//   const firstBatch = internalRoot.firstBatch
//   if (firstBatch === null) {
//     internalRoot.firstBatch = batch
//     batch._next = null
//   } else {
//     // Insert sorted by expiration time then insertion order
//     let insertAfter = null
//     let insertBefore = firstBatch
//     while (
//       insertBefore !== null &&
//       insertBefore._expirationTime >= expirationTime
//     ) {
//       insertAfter = insertBefore
//       insertBefore = insertBefore._next
//     }
//     batch._next = insertBefore
//     if (insertAfter !== null) {
//       insertAfter._next = batch
//     }
//   }

//   return batch
// }

function isValidContainer(node): boolean {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        node.nodeValue === ' zzeact-mount-point-unstable '))
  )
}

function getZzeactRootElementInContainer(container): null | HTMLElement {
  if (!container) {
    return null
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement
  } else {
    return container.firstChild
  }
}

function shouldHydrateDueToLegacyHeuristic(container): boolean {
  const rootElement = getZzeactRootElementInContainer(container)
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  )
}

function legacyCreateRootFromDOMContainer(
  container: DOMContainer,
  forceHydrate: boolean,
): Root {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container)
  if (!shouldHydrate) {
    let rootSibling
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling)
    }
  }
  const isConcurrent = false
  return new ZzeactRoot(container, isConcurrent, shouldHydrate)
}

function legacyRenderSubtreeIntoContainer(
  parentComponent: Zzeact$Element,
  children: ZzeactNodeList,
  container: DOMContainer,
  forceHydrate: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback?: () => any,
): void {
  let root: Root = container._zzeactRootContainer
  if (!root) {
    root = container._zzeactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    )
    if (typeof callback === 'function') {
      const originalCallback = callback
      callback = function(): void {
        const instance = getPublicRootInstance(root._internalRoot)
        originalCallback.call(instance)
      }
    }
    // // Initial mount should not be batched.
    unbatchedUpdates(() => {
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        )
      } else {
        root.render(children, callback)
      }
    })
  } else {
    if (typeof callback === 'function') {
      const originalCallback = callback
      callback = function(): void {
        const instance = getPublicRootInstance(root._internalRoot)
        originalCallback.call(instance)
      }
    }
    // Update
    if (parentComponent != null) {
      root.legacy_renderSubtreeIntoContainer(
        parentComponent,
        children,
        callback,
      )
    } else {
      root.render(children, callback)
    }
  }
  return getPublicRootInstance(root._internalRoot)
}

interface ZzeactDOM {
  render: Function
}

const ZzeactDOM = {
  render(
    element: Zzeact$Element,
    container: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback?: () => any,
  ) {
    invariant(
      isValidContainer(container),
      'Target container is not a DOM element.',
    )
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback,
    )
  },
  unmountComponentAtNode(container: DOMContainer): boolean {
    invariant(
      isValidContainer(container),
      'unmountComponentAtNode(...): Target container is not a DOM element.',
    )

    if (container._zzeactRootContainer) {
      unbatchedUpdates(() => {
        legacyRenderSubtreeIntoContainer(null, null, container, false, () => {
          container._zzeactRootContainer = null
        })
      })
      return true
    } else {
      return false
    }
  },
} as possibleHasDefault<ZzeactDOM>

export default ZzeactDOM
