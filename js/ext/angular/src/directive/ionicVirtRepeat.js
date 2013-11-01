(function() {
'use strict';
var uid               = ['0', '0', '0'];

/**
 * throw error if the name given is hasOwnProperty
 * @param  {String} name    the name to test
 * @param  {String} context the context in which the name is used, such as module or directive
 */
function assertNotHasOwnProperty(name, context) {
  if (name === 'hasOwnProperty') {
    throw ngMinErr('badname', "hasOwnProperty is not a valid {0} name", context);
  }
}

/**
 * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
 * characters such as '012ABC'. The reason why we are not using simply a number counter is that
 * the number string gets longer over time, and it can also overflow, where as the nextId
 * will grow much slower, it is a string, and it will never overflow.
 *
 * @returns an unique alpha-numeric string
 */
function nextUid() {
  var index = uid.length;
  var digit;

  while(index) {
    index--;
    digit = uid[index].charCodeAt(0);
    if (digit == 57 /*'9'*/) {
      uid[index] = 'A';
      return uid.join('');
    }
    if (digit == 90  /*'Z'*/) {
      uid[index] = '0';
    } else {
      uid[index] = String.fromCharCode(digit + 1);
      return uid.join('');
    }
  }
  uid.unshift('0');
  return uid.join('');
}

/**
 * @ngdoc function
 * @name angular.isString
 * @function
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString(value){return typeof value == 'string';}

/**
 * Checks if `obj` is a window object.
 *
 * @private
 * @param {*} obj Object to check
 * @returns {boolean} True if `obj` is a window obj.
 */
function isWindow(obj) {
  return obj && obj.document && obj.location && obj.alert && obj.setInterval;
}

/**
 * @private
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
function isArrayLike(obj) {
  if (obj == null || isWindow(obj)) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === 1 && length) {
    return true;
  }

  return isString(obj) || angular.isArray(obj) || length === 0 ||
         typeof length === 'number' && length > 0 && (length - 1) in obj;
}

/**
 * Computes a hash of an 'obj'.
 * Hash of a:
 *  string is string
 *  number is number as string
 *  object is either result of calling $$hashKey function on the object or uniquely generated id,
 *         that is also assigned to the $$hashKey property of the object.
 *
 * @param obj
 * @returns {string} hash string such that the same input will have the same hash string.
 *         The resulting string key is in 'type:hashKey' format.
 */
function hashKey(obj) {
  var objType = typeof obj,
      key;

  if (objType == 'object' && obj !== null) {
    if (typeof (key = obj.$$hashKey) == 'function') {
      // must invoke on object to keep the right this
      key = obj.$$hashKey();
    } else if (key === undefined) {
      key = obj.$$hashKey = nextUid();
    }
  } else {
    key = obj;
  }

  return objType + ':' + key;
}

angular.module('ionic.ui.virtRepeat', [])

.directive('virtRepeat', ['$parse', '$animate', function($parse, $animate) {
  var NG_REMOVED = '$$NG_REMOVED';
  return {
    transclude: 'element',
    priority: 1000,
    terminal: true,
    require: '?^virtualList',
    compile: function(element, attr, linker) {
      return function($scope, $element, $attr, virtualList) {
        var expression = $attr.virtRepeat;
        var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/),
          trackByExp, trackByExpGetter, trackByIdExpFn, trackByIdArrayFn, trackByIdObjFn,
          lhs, rhs, valueIdentifier, keyIdentifier,
          hashFnLocals = {$id: hashKey};

        if (!match) {
          throw ngRepeatMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.",
            expression);
        }

        lhs = match[1];
        rhs = match[2];
        trackByExp = match[4];

        if (trackByExp) {
          trackByExpGetter = $parse(trackByExp);
          trackByIdExpFn = function(key, value, index) {
            // assign key, value, and $index to the locals so that they can be used in hash functions
            if (keyIdentifier) hashFnLocals[keyIdentifier] = key;
            hashFnLocals[valueIdentifier] = value;
            hashFnLocals.$index = index;
            return trackByExpGetter($scope, hashFnLocals);
          };
        } else {
          trackByIdArrayFn = function(key, value) {
            return hashKey(value);
          };
          trackByIdObjFn = function(key) {
            return key;
          };
        }

        match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
        if (!match) {
          throw ngRepeatMinErr('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.",
                                                                    lhs);
        }
        valueIdentifier = match[3] || match[1];
        keyIdentifier = match[2];

        // Store a list of elements from previous run. This is a hash where key is the item from the
        // iterator, and the value is objects with following properties.
        //   - scope: bound scope
        //   - element: previous element.
        //   - index: position
        var lastBlockMap = {};

        //watch props
        $scope.$watchCollection(rhs, function ngRepeatAction(collection){
          var index, length,
              previousNode = $element[0],     // current position of the node
              nextNode,
              // Same as lastBlockMap but it has the current state. It will become the
              // lastBlockMap on the next iteration.
              nextBlockMap = {},
              arrayLength,
              childScope,
              key, value, // key/value of iteration
              trackById,
              trackByIdFn,
              collectionKeys,
              block,       // last object information {scope, element, id}
              nextBlockOrder = [],
              elementsToRemove;


          if (isArrayLike(collection)) {
            collectionKeys = collection;
            trackByIdFn = trackByIdExpFn || trackByIdArrayFn;
          } else {
            trackByIdFn = trackByIdExpFn || trackByIdObjFn;
            // if object, extract keys, sort them and use to determine order of iteration over obj props
            collectionKeys = [];
            for (key in collection) {
              if (collection.hasOwnProperty(key) && key.charAt(0) != '$') {
                collectionKeys.push(key);
              }
            }
            collectionKeys.sort();
          }

          arrayLength = collectionKeys.length;

          // locate existing items
          length = nextBlockOrder.length = collectionKeys.length;
          for(index = 0; index < length; index++) {
           key = (collection === collectionKeys) ? index : collectionKeys[index];
           value = collection[key];
           trackById = trackByIdFn(key, value, index);
           assertNotHasOwnProperty(trackById, '`track by` id');
           if(lastBlockMap.hasOwnProperty(trackById)) {
             block = lastBlockMap[trackById];
             delete lastBlockMap[trackById];
             nextBlockMap[trackById] = block;
             nextBlockOrder[index] = block;
           } else if (nextBlockMap.hasOwnProperty(trackById)) {
             // restore lastBlockMap
             forEach(nextBlockOrder, function(block) {
               if (block && block.startNode) lastBlockMap[block.id] = block;
             });
             // This is a duplicate and we need to throw an error
             throw ngRepeatMinErr('dupes', "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}",
                                                                                                                                                    expression,       trackById);
           } else {
             // new never before seen block
             nextBlockOrder[index] = { id: trackById };
             nextBlockMap[trackById] = false;
           }
         }

          // remove existing items
          for (key in lastBlockMap) {
            // lastBlockMap is our own object so we don't need to use special hasOwnPropertyFn
            if (lastBlockMap.hasOwnProperty(key)) {
              block = lastBlockMap[key];
              elementsToRemove = getBlockElements(block);
              $animate.leave(elementsToRemove);
              forEach(elementsToRemove, function(element) { element[NG_REMOVED] = true; });
              block.scope.$destroy();
            }
          }

          // we are not using forEach for perf reasons (trying to avoid #call)
          for (index = 0, length = collectionKeys.length; index < length; index++) {
            key = (collection === collectionKeys) ? index : collectionKeys[index];
            value = collection[key];
            block = nextBlockOrder[index];
            if (nextBlockOrder[index - 1]) previousNode = nextBlockOrder[index - 1].endNode;

            if (block.startNode) {
              // if we have already seen this object, then we need to reuse the
              // associated scope/element
              childScope = block.scope;

              nextNode = previousNode;
              do {
                nextNode = nextNode.nextSibling;
              } while(nextNode && nextNode[NG_REMOVED]);

              if (block.startNode != nextNode) {
                // existing item which got moved
                $animate.move(getBlockElements(block), null, angular.element(previousNode));
              }
              previousNode = block.endNode;
            } else {
              // new item which we don't know about
              childScope = $scope.$new();
            }

            childScope[valueIdentifier] = value;
            if (keyIdentifier) childScope[keyIdentifier] = key;
            childScope.$index = index;
            childScope.$first = (index === 0);
            childScope.$last = (index === (arrayLength - 1));
            childScope.$middle = !(childScope.$first || childScope.$last);
            // jshint bitwise: false
            childScope.$odd = !(childScope.$even = (index&1) === 0);
            // jshint bitwise: true

            /*
            if (!block.startNode) {
              linker(childScope, function(clone) {
                clone[clone.length++] = document.createComment(' end ngRepeat: ' + expression + ' ');
                $animate.enter(clone, null, angular.element(previousNode));
                previousNode = clone;
                block.scope = childScope;
                block.startNode = previousNode && previousNode.endNode ? previousNode.endNode : clone[0];
                block.endNode = clone[clone.length - 1];
                nextBlockMap[block.id] = block;
              });
            }
            */
          }
          lastBlockMap = nextBlockMap;
        });

        if(virtualList) {
          virtualList.listView.didScroll = function(e) {
            var itemHeight = this.itemHeight;

            // TODO: This would be inaccurate if we are windowed
            var totalItems = this.listEl.children.length;

            // Grab the total height of the list
            var scrollHeight = e.target.scrollHeight;

            // Get the viewport height
            var viewportHeight = this.el.parentNode.offsetHeight;

            // scrollTop is the current scroll position
            var scrollTop = e.scrollTop;

            // High water is the pixel position of the first element to include (everything before
            // that will be removed)
            var highWater = Math.max(0, e.scrollTop + this.virtualRemoveThreshold);

            // Low water is the pixel position of the last element to include (everything after
            // that will be removed)
            var lowWater = Math.min(scrollHeight, Math.abs(e.scrollTop) + viewportHeight + this.virtualAddThreshold);

            // Compute how many items per viewport size can show
            var itemsPerViewport = Math.floor((lowWater - highWater) / itemHeight);

            // Get the first and last elements in the list based on how many can fit
            // between the pixel range of lowWater and highWater
            var first = parseInt(Math.abs(highWater / itemHeight));
            var last = parseInt(Math.abs(lowWater / itemHeight));

            // Get the items we need to remove
            this._virtualItemsToRemove = Array.prototype.slice.call(this.listEl.children, 0, first);

            // Grab the nodes we will be showing
            var nodes = Array.prototype.slice.call(this.listEl.children, first, first + itemsPerViewport);

            console.log('RENDER VIEWPORT', itemHeight, totalItems, highWater, lowWater, first, last);
          };
        }

      };
    }
  };
        

  function getBlockElements(block) {
    if (block.startNode === block.endNode) {
      return angular.element(block.startNode);
    }

    var element = block.startNode;
    var elements = [element];

    do {
      element = element.nextSibling;
      if (!element) break;
      elements.push(element);
    } while (element !== block.endNode);

    return angular.element(elements);
  }
}]);

/*
.directive('virtRepeat', ['$log', function($log) {
  return {
    require: ['?ngModel', '^virtualList'],
    transclude: 'element',
    priority: 1000,
    terminal: true,
    compile: function(element, attr, transclude) {
      // Parse the repeat expression
      var match = attr.virtRepeat.match(/^\s*([\$\w]+)\s+in\s+(\S*)\s*$/);
      if (! match) {
        throw new Error("Expected virRepeat in form of '_item_ in _collection_' but got '" + expression + "'.");
      }

      var expr = {
        value: match[1],
        collection: match[2]
      };

      // Linking func
      return function($scope, $element, $attr, ctrls) {
        var virtualList = ctrls[1];
        var _this = this;

        var state = {
          //  - The index of the first active element
          firstActive: 0,
          //  - The index of the first visible element
          firstVisible: 0,
          //  - The number of elements visible in the viewport.
          visible: 0,
          // - The number of active elements
          active: 0,
          // - The total number of elements
          total: 0,
          // - The point ahead at which we add new elements
          lowWater: 100,
          // - The point behind at which we remove old elements
          highWater: -300
        };

        var makeNewScope = function(idx, collection, containerScope) {
          var childScope = containerScope.$new();
          childScope[expr.value] = collection[idx];
          childScope.$index = idx;
          childScope.$first = (idx === 0);
          childScope.$last = (idx === (collection.length - 1));
          childScope.$middle = !(childScope.$first || childScope.$last);
          childScope.$watch(function updateChildScopeItem(){
            childScope[expr.value] = collection[idx];
          });
          return childScope;
        };

        var addElements = function(start, end, collection, containerScope, insPoint) {
          var frag = document.createDocumentFragment();
          var newElements = [], element, idx, childScope;
          for( idx = start; idx !== end; idx ++ ){
            childScope = makeNewScope(idx, collection, containerScope);
            element = transclude(childScope, angular.noop);
            setElementCss(element);
            newElements.push(element);
            frag.appendChild(element[0]);
          }
          insPoint.after(frag);
          return newElements;
        };

        var recomputeActive = function() {
          // The goal of this function is to calculate the start element
          // index and how many to show in the list

          // Get the start element
          if(state.firstActive > (state.firstVisible - state.lowWater)) {
          }


          // We want to set the start to the low water mark unless the current
          // start is already between the low and high water marks.
          var start = clip(state.firstActive, state.firstVisible - state.lowWater, state.firstVisible - state.highWater);

          // Similarly for the end
          var end = clip(state.firstActive + state.active,
                         state.firstVisible + state.visible + state.lowWater,
                         state.firstVisible + state.visible + state.highWater );
          state.firstActive = Math.max(0, start);
          state.active = Math.min(end, state.total) - state.firstActive;
        };

        // When the watch expression changes for the collection
        // our scope is bound to, do the magical fairy dust stuff
        var virtRepeatListener = function(newValue, oldValue, scope) {
          var oldEnd = oldValue.start + oldValue.active,
              collection = scope.$eval(expr.collection),
              newElements;

          if(newValue === oldValue) {
            $log.info('initial listen');
            newElements = addElements(newValue.start, oldEnd, collection, scope, $element);
            rendered = newElements;
            if(rendered.length) {
              rowHeight = computeRowHeight(newElements[0][0]);
            }
          } else {
            var newEnd = newValue.start + newValue.active;
            var forward = newValue.start >= oldValue.start;
            var delta = forward ? newValue.start - oldValue.start
                                : oldValue.start - newValue.start;
            var endDelta = newEnd >= oldEnd ? newEnd - oldEnd : oldEnd - newEnd;
            var contiguous = delta < (forward ? oldValue.active : newValue.active);
            $log.info('change by %o,%o rows %s', delta, endDelta, forward ? 'forward' : 'backward');
            if(!contiguous) {
              $log.info('non-contiguous change');
              destroyActiveElements('pop', rendered.length);
              rendered = addElements(newValue.start, newEnd, collection, scope, $element);
            } else {
              if(forward ) {
                $log.info('need to remove from the top');
                destroyActiveElements('shift', delta);
              } else if(delta) {
                $log.info('need to add at the top');

                newElements = addElements(
                  newValue.start,
                  oldValue.start,
                  collection, scope, $element);

                rendered = newElements.concat(rendered);
              }

              if(newEnd < oldEnd) {

                $log.info('need to remove from the bottom');
                destroyActiveElements('pop', oldEnd - newEnd);

              } else if(endDelta) {

                var lastElement = rendered[rendered.length-1];

                $log.info('need to add to the bottom');

                newElements = addElements(
                  oldEnd,
                  newEnd,
                  collection, scope, lastElement);

                rendered = rendered.concat(newElements);

              }
            }
            if(!rowHeight && rendered.length) {
              rowHeight = computeRowHeight(rendered[0][0]);
            }

            dom.content.css({'padding-top': newValue.start * rowHeight + 'px'});
          }
          dom.content.css({'height': newValue.len * rowHeight + 'px'});
          if( sticky ){
            dom.viewport[0].scrollTop = dom.viewport[0].clientHeight + dom.viewport[0].scrollHeight;
          }
        };

        $scope.$watchCollection(expr.collection, virtRepeatListener);
        // watch for changes on the repeat expression
        $scope.$watch(function(scope) {
          // Evaluate the collection
          var coll = scope.$eval(expr.collection);

          if(coll.length !== state.total) {
            state.total = coll.length;
            state.active = Math.min(state.end, state.total) - state.first;
          }
          return {
            start: state.firstActive,
            active: state.active,
            len: coll.length
          };
        }, virtRepeatListener, true);


        // Listen for scroll events
        virtualList.listView.didScroll = function(e) {
          console.log('RENDER VIEWPORT', high, low, start, end);
          state.first = start;
          state.end = end;
          // Calculate how many items will be rendered
          state.active = Math.min(end, state.total) - state.first;

          var itemHeight = this.itemHeight;

          // TODO: This would be inaccurate if we are windowed
          var totalItems = this.listEl.children.length;

          // Grab the total height of the list
          var scrollHeight = e.target.scrollHeight;

          // Get the viewport height
          var viewportHeight = this.el.parentNode.offsetHeight;

          // scrollTop is the current scroll position
          var scrollTop = e.scrollTop;

          // High water is the pixel position of the first element to include (everything before
          // that will be removed)
          var highWater = Math.max(0, e.scrollTop + this.virtualRemoveThreshold);

          // Low water is the pixel position of the last element to include (everything after
          // that will be removed)
          var lowWater = Math.min(scrollHeight, Math.abs(e.scrollTop) + viewportHeight + this.virtualAddThreshold);

          // Compute how many items per viewport size can show
          var itemsPerViewport = Math.floor((lowWater - highWater) / itemHeight);

          // Get the first and last elements in the list based on how many can fit
          // between the pixel range of lowWater and highWater
          var first = parseInt(Math.abs(highWater / itemHeight));
          var last = parseInt(Math.abs(lowWater / itemHeight));

          // Get the items we need to remove
          this._virtualItemsToRemove = Array.prototype.slice.call(this.listEl.children, 0, first);

          // Grab the nodes we will be showing
          var nodes = Array.prototype.slice.call(this.listEl.children, first, first + itemsPerViewport);
          scope.$apply(function(){
          });          

        }

      }
    }
  }
}]);
*/

})(ionic);
