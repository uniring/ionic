(function() {
'use strict';
angular.module('ionic.ui.virt', [])


.directive('virt', ['$parse', '$animate', function($parse, $animate) {
  return {
    require: '^virtualList',
    transclude: 'element',
    priority: 1000,
    terminal: true,


    compile: function(element, attr, linker) {

      return function($scope, $element, $attr, virtualList) {
        // Parse the expression
        var expression = $attr.virt;
        var match = expression.match(/^\s*(.+)\s+in\s+(.*?)\s*(\s+track\s+by\s+(.+)\s*)?$/);
        var lhs, rhs, keyIdentifier, valueIdentifier;
        var entireCollection, activeCollection;
        var lastStart, lastEnd;

        if (!match) {
          throw ngRepeatMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.",
            expression);
        }

        lhs = match[1];
        rhs = match[2];

        match = lhs.match(/^(?:([\$\w]+)|\(([\$\w]+)\s*,\s*([\$\w]+)\))$/);
        if (!match) {
          throw ngRepeatMinErr('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.",
                                                                    lhs);
        }

        valueIdentifier = match[3] || match[1];
        keyIdentifier = match[2];
        var previousNode = $element[0];

        // Add the items from the given collection to the list DOM
        var addItems = function(items, start, end, afterElement) {
          // Show those items
          var newItems = [];
          var childScope, value, key;
          for(var i = start, j = end; i < j; i++) {
            key = i;
            value = items[i];

            newItems.push(value);

            // Check if this thing already had a scope,
            // or create a new one
            /*
            if(value.scope) {
              childScope = value.scope;
            } else {
            */
            childScope = $scope.$new();
             
            childScope[valueIdentifier] = value;

            if (keyIdentifier) childScope[keyIdentifier] = key;

            // Transclude the element, 
            linker(childScope, function(clone) {
              $animate.enter(clone, null, afterElement);
              value.scope = childScope;
              value.node = clone;
              afterElement = clone;
              //frag.appendChild(clone[0]);
              //block.scope = childScope;
              //block.startNode = previousNode && previousNode.endNode ? previousNode.endNode : clone[0];
              //block.endNode = clone[clone.length - 1];
              //nextBlockMap[block.id] = block;
            });
          }

          return newItems;
        };

        var destroyItems = function(items, action, count) {
          var dead, i, remover = Array.prototype[action];
          for(i = 0; i < count; i++){
            dead = remover.call(items);
            dead.scope.$destroy();
            dead.node.remove();
          }
        };

        var calculateViewport = function(collection) {
          var toRemove = [], toAdd = [];

          // Grab the bounds of the viewport
          var bounds = virtualList.listView.getViewportBounds(collection);
          console.dir(bounds);

          // If we don't have a last start or end, store that
          if(typeof activeCollection === 'undefined') {
            lastStart = bounds.first;
            lastEnd = bounds.last;

            activeCollection = addItems(collection, bounds.first, bounds.last, $element);
          }
          // Grab the items we can display in the viewport
          var items = Array.prototype.slice.call(collection, bounds.first, bounds.last);
          // Grab the new ending point
          var newEnd = bounds.first + bounds.itemsPerViewport;

          // Check if we've moved down or up
          var forward = bounds.first >= lastStart;

          // Calculate how many items we'ved moved up or down
          var delta = Math.abs(bounds.first - lastStart);
          var endDelta = Math.abs(bounds.last - lastEnd);

          if(delta !== 0) {
            console.log('Forward', forward, 'By', delta);
          }


          if(forward) {
            // If we've scrolled further down the list, we need to
            // remove items above
            var numToRemove = bounds.first - lastStart;
            if(numToRemove > 0) {
              console.log('Removing', numToRemove, 'items FROM BEGIN');
              destroyItems(activeCollection, 'shift', numToRemove);
            }
          } else if(delta) {
            // If we've scrolled further up the list, we need to
            // add items above
            var numToAdd = delta;
            console.log('Adding', numToAdd, 'To end');

            var newItems = addItems(collection, bounds.first, lastStart, $element);
            for(var i = 0; i < newItems.length; i++){
              console.log('Added', newItems[i].text);
            }

            // Add items to the beginning of our active collection
            activeCollection = newItems.concat(activeCollection);
          }
          
          if(bounds.last < lastEnd) {
            // If we've scrolled further up the list, we need to
            // remove items below
            var numToRemove = lastStart - bounds.first;
            console.log('Removing', numToRemove, 'items FROM END');
            destroyItems(activeCollection, 'pop', numToRemove);

          } else if(endDelta) {
            // If we've scrolled further down the list, we need to
            // add items below
            var numToAdd = bounds.last - lastEnd;
            console.log('Adding', numToAdd, 'To end');
            var indexToStart = bounds.first + bounds.itemsPerViewport;
            var lastElement = activeCollection[activeCollection.length-1].node;
            var newItems = addItems(collection, lastEnd, bounds.last, lastElement);
            for(var i = 0; i < newItems.length; i++){
              console.log('Added', newItems[i].text);
            }
            activeCollection = activeCollection.concat(newItems);
          }


          // Store the current start and end position of the list window
          lastStart = bounds.first;
          lastEnd = bounds.last;
        };

        // Watch the collection for changes
        $scope.$watchCollection(rhs, function(collection) {
          entireCollection = collection;

          // Update the viewable window
          calculateViewport(collection);
        });
          
        var onScroll = ionic.Utils.throttle(function(e) {
          $scope.$apply(function() {
            // Update the viewable window
            calculateViewport(entireCollection);
          });
        }, 50);

        virtualList.listView.didScroll = onScroll;
      }
    }
  };
}]);

})(ionic);

