/**
 * Create a wrapping module to ease having to include too many
 * modules.
 */
angular.module('ionic.ui', ['ionic.ui.content',
                            'ionic.ui.tabs',
                            'ionic.ui.nav',
                            'ionic.ui.sideMenu',
                            'ionic.ui.list',
                            'ionic.ui.checkbox',
                            'ionic.ui.toggle'
                           ]);

;
angular.module('ionic.service.actionSheet', ['ionic.service.templateLoad', 'ionic.ui.actionSheet'])

.factory('ActionSheet', ['$rootScope', '$document', '$compile', 'TemplateLoader', function($rootScope, $document, $compile, TemplateLoader) {
  return {
    /**
     * Load an action sheet with the given template string.
     *
     * A new isolated scope will be created for the 
     * action sheet and the new element will be appended into the body.
     *
     * @param {object} opts the options for this ActionSheet (see docs)
     */
    show: function(opts) {
      var scope = $rootScope.$new(true);

      angular.extend(scope, opts);

      scope.cancel = function() {
        scope.sheet.hide();
        //scope.$destroy();
        opts.cancel();
      };

      scope.buttonClicked = function(index) {
        // Check if the button click event returned true, which means
        // we can close the action sheet
        if((opts.buttonClicked && opts.buttonClicked(index)) === true) {
          scope.sheet.hide();
          //scope.$destroy();
        }
      };

      scope.destructiveButtonClicked = function() {
        // Check if the destructive button click event returned true, which means
        // we can close the action sheet
        if((opts.destructiveButtonClicked && opts.destructiveButtonClicked()) === true) {
          scope.sheet.hide();
          //scope.$destroy();
        }
      };

      // Compile the template
      var element = $compile('<action-sheet buttons="buttons"></action-sheet>')(scope);

      var s = element.scope();

      $document[0].body.appendChild(element[0]);

      var sheet = new ionic.views.ActionSheet({el: element[0] });
      s.sheet = sheet;

      sheet.show();

      return sheet;
    }
  };
}]);
;
angular.module('ionic.service.gesture', [])

.factory('Gesture', [function() {
  return {
    on: function(eventType, cb, element) {
      return window.ionic.onGesture(eventType, cb, element);
    }
  };
}]);
;
angular.module('ionic.service.loading', ['ionic.ui.loading'])

.factory('Loading', ['$rootScope', '$document', '$compile', function($rootScope, $document, $compile) {
  return {
    /**
     * Load an action sheet with the given template string.
     *
     * A new isolated scope will be created for the 
     * action sheet and the new element will be appended into the body.
     *
     * @param {object} opts the options for this ActionSheet (see docs)
     */
    show: function(opts) {
      var defaults = {
        content: '',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 2000
      };

      opts = angular.extend(defaults, opts);

      var scope = $rootScope.$new(true);
      angular.extend(scope, opts);

      // Make sure there is only one loading element on the page at one point in time
      var existing = angular.element($document[0].querySelector('.loading-backdrop'));
      if(existing.length) {
        var scope = existing.scope();
        if(scope.loading) {
          scope.loading.show();
          return scope.loading;
        }
      }

      // Compile the template
      var element = $compile('<loading>' + opts.content + '</loading>')(scope);

      $document[0].body.appendChild(element[0]);

      var loading = new ionic.views.Loading({
        el: element[0],
        maxWidth: opts.maxWidth,
        showDelay: opts.showDelay
      });

      loading.show();

      scope.loading = loading;

      return loading;
    }
  };
}]);
;
angular.module('ionic.service.modal', ['ionic.service.templateLoad'])


.factory('Modal', ['$rootScope', '$document', '$compile', 'TemplateLoader', function($rootScope, $document, $compile, TemplateLoader) {
  return {
    /**
     * Load a modal with the given template string.
     *
     * A new isolated scope will be created for the 
     * modal and the new element will be appended into the body.
     */
    fromTemplate: function(templateString) {
      // Create a new isolated scope for the modal
      var scope = $rootScope.$new(true);

      // Compile the template
      var element = $compile(templateString)(scope);
      $document[0].body.appendChild(element[0]);

      var modal = new ionic.views.Modal({el: element[0] });
      scope.modal = modal;
      return modal;
    },
    fromTemplateUrl: function(url, cb) {
      TemplateLoader.load(url).then(function(templateString) {
        // Create a new isolated scope for the modal
        var scope = $rootScope.$new(true);

        // Compile the template
        var element = $compile(templateString)(scope);
        $document[0].body.appendChild(element[0]);
      
        var modal = new ionic.views.Modal({ el: element[0] });
        scope.modal = modal;

        cb(modal);
      });
    }
  };
}]);
;
angular.module('ionic.service.popup', ['ionic.service.templateLoad'])


.factory('Popup', ['$rootScope', '$document', '$compile', 'TemplateLoader', function($rootScope, $document, $compile, TemplateLoader) {

  var getPopup = function() {
    // Make sure there is only one loading element on the page at one point in time
    var existing = angular.element($document[0].querySelector('.popup'));
    if(existing.length) {
      var scope = existing.scope();
      if(scope.popup) {
        return scope;
      }
    }
  };

  return {
    alert: function(message) {

      // If there is an existing popup, just show that one
      var existing = getPopup();
      if(existing) {
        return existing.popup.alert(message);
      }

      var defaults = {
        title: message,
        animation: 'fade-in',
      };

      opts = angular.extend(defaults, opts);

      var scope = $rootScope.$new(true);
      angular.extend(scope, opts);

      // Compile the template
      var element = $compile('<popup>' + opts.content + '</popup>')(scope);
      $document[0].body.appendChild(element[0]);

      var popup = new ionic.views.Popup({el: element[0] });
      popup.alert(message);

      scope.popup = popup;

      return popup;
    },
    confirm: function(cb) {
    },
    prompt: function(cb) {
    },
    show: function(data) {
      // data.title
      // data.template
      // data.buttons
    }
  };
}]);
;
angular.module('ionic.service.templateLoad', [])

.factory('TemplateLoader', ['$q', '$http', '$templateCache', function($q, $http, $templateCache) {
  return {
    load: function(url) {
      var deferred = $q.defer();

      $http.get(url, { cache: $templateCache }).success(function(html) {
        deferred.resolve(html && html.trim());
      });

      return deferred.promise;
    }
  };
}]);
;
(function() {
'use strict';

angular.module('ionic.ui.actionSheet', [])

.directive('actionSheet', function() {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    link: function($scope, $element){
      $scope.$on('$destroy', function() {
        $element.remove();
      });
    },
    template: '<div class="action-sheet slide-in-up">' +
                '<div class="action-sheet-group">' +
                  '<div class="action-sheet-title" ng-if="titleText">{{titleText}}</div>' +
                  '<button class="button" ng-click="buttonClicked($index)" ng-repeat="button in buttons">{{button.text}}</button>' +
                '</div>' +
                '<div class="action-sheet-group" ng-if="destructiveText">' +
                  '<button class="button destructive" ng-click="destructiveButtonClicked()">{{destructiveText}}</button>' +
                '</div>' +
                '<div class="action-sheet-group" ng-if="cancelText">' +
                  '<button class="button" ng-click="cancel()">{{cancelText}}</button>' +
                '</div>' +
              '</div>'
  };
});

})();
;
(function() {
'use strict';

angular.module('ionic.ui.checkbox', [])


.directive('checkbox', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    scope: true,
    template: '<div class="checkbox"><input type="checkbox"><div class="handle"></div></div>',

    link: function($scope, $element, $attr, ngModel) {
      var checkbox, handle;

      if(!ngModel) { return; }

      checkbox = $element.children().eq(0);
      handle = $element.children().eq(1);

      if(!checkbox.length || !handle.length) { return; }

      $scope.checkbox = new ionic.views.Checkbox({ 
        el: $element[0],
        checkbox: checkbox[0],
        handle: handle[0]
      });

      $element.bind('click', function(e) {
        $scope.checkbox.tap(e);
        $scope.$apply(function() {
          ngModel.$setViewValue(checkbox[0].checked);
        });
      });

      ngModel.$render = function() {
        $scope.checkbox.val(ngModel.$viewValue);
      };
    }
  };
});

})();
;
(function() {
'use strict';

angular.module('ionic.ui.content', [])

// The content directive is a core scrollable content area
// that is part of many View hierarchies
.directive('content', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<div class="content"></div>',
    transclude: true,
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr) {
        var c = $element.eq(0);

        if(attr.padded) {
          c.addClass('padding');
        }

        if(attr.hasHeader) {
          c.addClass('has-header');
        }
        if(attr.hasFooter) {
          c.addClass('has-footer');
        }
        if(attr.hasTabs) {
          c.addClass('has-tabs');
        }
        $element.append(transclude($scope));
      };
    }
  };
});
})();
;
(function() {
'use strict';

angular.module('ionic.ui.list', ['ngAnimate'])

.directive('listItem', function() {
  return {
    restrict: 'E',
    require: ['?^list', '?^virtualList'],
    replace: true,
    transclude: true,
    scope: {
      item: '=',
      onSelect: '&',
      onDelete: '&',
      canDelete: '@',
      canReorder: '@',
      canSwipe: '@',
      buttons: '=',
    },
    template: '<a href="#" class="item item-slider">\
            <div class="item-content slide-left" ng-transclude>\
            </div>\
            <div class="item-options" ng-if="canSwipe && !isEditing">\
             <button ng-click="buttonClicked(button)" class="button" ng-class="button.type" ng-repeat="button in buttons">{{button.text}}</button>\
           </div>\
          </a>',

    /*
    template:   '<li class="list-item">\
                   <div class="list-item-edit" ng-if="canDelete && isEditing">\
                     <button class="button button-icon" ng-click="onDelete()"><i ng-class="deleteIcon"></i></button>\
                   </div>\
                   <div class="list-item-content" ng-transclude>\
                   </div>\
                   <div class="list-item-drag" ng-if="canReorder && isEditing">\
                     <button data-ionic-action="reorder" class="button button-icon"><i ng-class="reorderIcon"></i></button>\
                   </div>\
                   <div class="list-item-buttons" ng-if="canSwipe && !isEditing">\
                     <button ng-click="buttonClicked(button)" class="button" ng-class="button.type" ng-repeat="button in buttons">{{button.text}}</button>\
                   </div>\
                </li>',*/
    link: function($scope, $element, $attr, list) {
      // Grab the parent list controller
      if(list[0]) {
        list = list[0];
      } else if(list[1]) {
        list = list[1];
      }

      $scope.isEditing = false;
      $scope.deleteIcon = list.scope.deleteIcon;
      $scope.reorderIcon = list.scope.reorderIcon;

      $scope.buttonClicked = function(button) {
        button.onButtonClicked && button.onButtonClicked($scope.item, button);
      };

      list.scope.$watch('isEditing', function(v) {
        $scope.isEditing = v;
      });
    }
  };
})

.directive('list', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,

    scope: {
      isEditing: '=',
      deleteIcon: '@',
      reorderIcon: '@'
    },

    controller: function($scope) {
      var _this = this;

      this.scope = $scope;

      $scope.$watch('isEditing', function(v) {
        _this.isEditing = true;
      });
    },

    template: '<ul class="list" ng-class="{\'list-editing\': isEditing}" ng-transclude>\
              </ul>',

    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr) {
        var lv = new ionic.views.List({el: $element[0]});

        if(attr.animation) {
          $element.addClass(attr.animation);
        }
      };
    }
  };
})

.directive('virtualList', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,

    scope: {
      isEditing: '=',
      deleteIcon: '@',
      reorderIcon: '@',
      itemHeight: '@'
    },

    controller: function($scope, $element) {
      var _this = this;

      this.scope = $scope;

      this.element = $element;

      var lv = new ionic.views.ListView({
        el: $element[0],
        listEl: $element[0].children[0],
        isVirtual: true,
        itemHeight: parseInt($scope.itemHeight)
      });

      this.listView = lv;


      $scope.$watch('isEditing', function(v) {
        _this.isEditing = true;
      });
    },

    template: '<div class="scroll"><ul class="list" ng-class="{\'list-editing\': isEditing}" ng-transclude>\
              </ul></div>',

    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr) {
        if(attr.animation) {
          $element.addClass(attr.animation);
        }
      };
    }
  };
})

})();
;
(function() {
'use strict';

angular.module('ionic.ui.loading', [])

.directive('loading', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    link: function($scope, $element){
      $scope.$on('$destroy', function() {
        $element.remove();
      });
      $element.addClass($scope.animation || '');
    },
    template: '<div class="loading-backdrop" ng-class="{enabled: showBackdrop}">' + 
                '<div class="loading" ng-transclude>' +
                '</div>' +
              '</div>'
  };
});

})();
;
(function() {
'use strict';

angular.module('ionic.ui.nav', ['ionic.service.templateLoad', 'ionic.service.gesture', 'ngAnimate'])

.controller('NavCtrl', ['$scope', '$element', '$animate', '$compile', 'TemplateLoader', function($scope, $element, $animate, $compile, TemplateLoader) {
  var _this = this;

  angular.extend(this, ionic.controllers.NavController.prototype);

  ionic.controllers.NavController.call(this, {
    content: {
    },
    navBar: {
      shouldGoBack: function() {
      },
      show: function() {
        this.isVisible = true;
      },
      hide: function() {
        this.isVisible = false;
      },
      setTitle: function(title) {
        $scope.navController.title = title;
      },
      showBackButton: function(show) {
      },
    }
  });

  this.handleDrag = function(e) {
  };

  this.endDrag = function(e) {
  };

  /**
   * Push a template onto the navigation stack.
   * @param {string} templateUrl the URL of the template to load.
   */
  this.pushFromTemplate = function(templateUrl) {
    var childScope = $scope.$new();
    childScope.isVisible = true;

    // Load the given template
    TemplateLoader.load(templateUrl).then(function(templateString) {

      // Compile the template with the new scrope, and append it to the navigation's content area
      var el = $compile(templateString)(childScope, function(cloned, scope) {
        var content = $element[0].querySelector('.content');
        angular.element(content).append(cloned);
      });
    });
  };

  /**
   * Push a controller to the stack. This is called by the child
   * nav-content directive when it is linked to a scope on the page.
   */
  $scope.pushController = function(scope, element) {
    _this.push(scope);
  };

  $scope.navController = this;
}])

.directive('navs', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    controller: 'NavCtrl',
    //templateUrl: 'ext/angular/tmpl/ionicTabBar.tmpl.html',
    template: '<div class="view" ng-transclude></div>',
  };
})

.directive('navBar', function() {
  return {
    restrict: 'E',
    require: '^navs',
    replace: true,
    scope: true,
    template: '<header class="bar bar-header bar-dark nav-bar" ng-class="{hidden: !navController.navBar.isVisible}">' + 
        '<a href="#" ng-click="goBack()" class="button" ng-if="navController.controllers.length > 1">Back</a>' +
        '<h1 class="title">{{navController.getTopController().title}}</h1>' + 
      '</header>',
    link: function(scope, element, attrs, navCtrl) {
      scope.navController = navCtrl;
      scope.$watch('navController.controllers.length', function(value) {
      });
      scope.goBack = function() {
        navCtrl.pop();
      };
    }
  };
})

.directive('navContent', ['Gesture', '$animate', function(Gesture, $animate) {
  return {
    restrict: 'ECA',
    require: '^navs',
    scope: true,
    transclude: 'element',
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr, navCtrl) {
        var lastParent, lastIndex, childScope, childElement;

        $scope.title = $attr.title;

        if($attr.navBar === "false") {
          navCtrl.hideNavBar();
        } else {
          navCtrl.showNavBar();
        }

        $scope.pushController($scope, $element);

        
        $scope.$watch('isVisible', function(value) {
          if(childElement) {
            $animate.leave(childElement);
            childElement = undefined;
          }
          if(childScope) {
            childScope.$destroy();
            childScope = undefined;
          }
          if(value) {
            childScope = $scope.$new();
            transclude(childScope, function(clone) {
              childElement = clone;
              Gesture.on('drag', function(e) {
                //navCtrl.handleDrag(e);
                console.log('Content drag', e);
              }, childElement[0]);

              Gesture.on('release', function(e) {
                //navCtrl._endDrag(e);
              }, childElement[0]);

              var title = $element.parent().parent().parent()[0].querySelector('.title');
              $animate.enter(clone, $element.parent(), $element);
              $animate.addClass(angular.element(title), 'slide-left-fade', function() {
                $animate.removeClass(angular.element(title), 'slide-left-fade', function() {
                });
              });
            });
          }
        });
      }
    }
  };
}]);

})();
;
;
(function() {
'use strict';

/**
 * @description
 * The sideMenuCtrl lets you quickly have a draggable side
 * left and/or right menu, which a center content area.
 */

angular.module('ionic.ui.sideMenu', ['ionic.service.gesture'])

/**
 * The internal controller for the side menu controller. This
 * extends our core Ionic side menu controller and exposes
 * some side menu stuff on the current scope.
 */
.controller('SideMenuCtrl', function($scope) {
  var _this = this;

  angular.extend(this, ionic.controllers.SideMenuController.prototype);

  ionic.controllers.SideMenuController.call(this, {
    left: {
      width: 270,
      pushDown: function() {
        $scope.leftZIndex = -1;
      },
      bringUp: function() {
        $scope.leftZIndex = 0;
      }
    },
    right: {
      width: 270,
      pushDown: function() {
        $scope.rightZIndex = -1;
      },
      bringUp: function() {
        $scope.rightZIndex = 0;
      }
    }
  });

  $scope.contentTranslateX = 0;

  $scope.sideMenuCtrl = this;
})

.directive('sideMenuCtrl', function() {
  return {
    restrict: 'CA',
    controller: 'SideMenuCtrl',
  };
})

.directive('sideMenuContent', ['Gesture', function(Gesture) {
  return {
    restrict: 'CA',
    require: '^sideMenuCtrl',
    scope: true,
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr, sideMenuCtrl) {

        Gesture.on('drag', function(e) {
          sideMenuCtrl._handleDrag(e);
        }, $element[0]);

        Gesture.on('release', function(e) {
          sideMenuCtrl._endDrag(e);
        }, $element[0]);

        sideMenuCtrl.setContent({
          onDrag: function(e) {},
          endDrag: function(e) {},
          getTranslateX: function() {
            return $scope.contentTranslateX || 0;
          },
          setTranslateX: function(amount) {
            $scope.contentTranslateX = amount;
            $element[0].style.webkitTransform = 'translate3d(' + amount + 'px, 0, 0)';
          },
          enableAnimation: function() {
            //this.el.classList.add(this.animateClass);
            $scope.animationEnabled = true;
            $element[0].classList.add('menu-animated');
          },
          disableAnimation: function() {
            //this.el.classList.remove(this.animateClass);
            $scope.animationEnabled = false;
            $element[0].classList.remove('menu-animated');
          }
        });
      };
    }
  };
}])


.directive('menu', function() {
  return {
    restrict: 'E',
    require: '^sideMenuCtrl',
    replace: true,
    transclude: true,
    scope: {
      side: '@'
    },
    template: '<div class="menu menu-{{side}}"></div>',
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr, sideMenuCtrl) {

        if($scope.side == 'left') {
          sideMenuCtrl.left.isEnabled = true;
        } else if($scope.side == 'right') {
          sideMenuCtrl.right.isEnabled = true;
        }

        $element.append(transclude($scope));
      };
    }
  };
});
})();
;
(function() {
'use strict';

/**
 * @description
 * The sideMenuCtrl lets you quickly have a draggable side
 * left and/or right menu, which a center content area.
 */

angular.module('ionic.ui.slideBox', [])

/**
 * The internal controller for the side menu controller. This
 * extends our core Ionic side menu controller and exposes
 * some side menu stuff on the current scope.
 */
.controller('SlideBoxCtrl', ['$scope', '$element', function($scope, $element) {
  $scope.slides = [];
  this.slideAdded = function() {
    $scope.slides.push({});
  };
}])

.directive('slideBox', ['$compile', function($compile) {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    controller: 'SlideBoxCtrl',
    scope: {},
    template: '<div class="slide-box">\
            <div class="slide-box-slides" ng-transclude>\
            </div>\
          </div>',

    postLink: function() {
      console.log('POST LINK');
    },
    link: function($scope, $element, $attr, slideBoxCtrl) {
      // If the pager should show, append it to the slide box
      if($attr.showPager !== "false") {
        var childScope = $scope.$new();
        var pager = $compile('<pager></pager>')(childScope);
        $element.append(pager);

        $scope.slideBox = new ionic.views.SlideBox({
          el: $element[0]
        });
      }
    }
  }
}])

.directive('slide', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '^slideBox',
    transclude: true,
    template: '<div class="slide-box-slide" ng-transclude></div>',
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr, slideBoxCtrl) {
        slideBoxCtrl.slideAdded();
      }
    }
  }
})

.directive('pager', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '^slideBox',
    template: '<div class="slide-box-pager"><span ng-repeat="slide in slides"><i class="icon-record"></i></span></div>'
  }

});

})();
;
angular.module('ionic.ui.tabs', ['ngAnimate'])

.controller('TabsCtrl', ['$scope', '$element', '$animate', function($scope, $element, $animate) {
  var _this = this;

  angular.extend(this, ionic.controllers.TabBarController.prototype);

  ionic.controllers.TabBarController.call(this, {
    controllerChanged: function(oldC, oldI, newC, newI) {
      $scope.controllerChanged && $scope.controllerChanged({
        oldController: oldC,
        oldIndex: oldI,
        newController: newC,
        newIndex: newI
      });
    },
    tabBar: {
      tryTabSelect: function() {},
      setSelectedItem: function(index) {},
      addItem: function(item) {}
    }
  });

  this.add = function(controller) {
    this.addController(controller);
    this.select(0);
  };

  this.select = function(controllerIndex) {
    //var oldIndex = _this.getSelectedIndex();

    $scope.activeAnimation = $scope.animation;
    /*
    if(controllerIndex > oldIndex) {
    } else if(controllerIndex < oldIndex) {
      $scope.activeAnimation = $scope.animation + '-reverse';
    }
    */
    _this.selectController(controllerIndex);
  };

  $scope.controllers = this.controllers;
}])

.directive('tabs', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      animation: '@',
      controllerChanged: '&'
    },
    transclude: true,
    controller: 'TabsCtrl',
    //templateUrl: 'ext/angular/tmpl/ionicTabBar.tmpl.html',
    template: '<div class="view"><tab-controller-bar></tab-controller-bar></div>',
    compile: function(element, attr, transclude, tabsCtrl) {
      return function($scope, $element, $attr) {
        $scope.$watch('activeAnimation', function(value) {
          //$element.removeClass($scope.animation + ' ' + $scope.animation + '-reverse');
          $element.addClass($scope.activeAnimation);
        });
        transclude($scope, function(cloned) {
          $element.prepend(cloned);
        });
      };
    }
  };
})

// Generic controller directive
.directive('tab', ['$animate', function($animate) {
  return {
    restrict: 'E',
    replace: true,
    require: '^tabs',
    scope: true,
    transclude: 'element',
    compile: function(element, attr, transclude) {
      return function($scope, $element, $attr, tabsCtrl) {
        var childScope, childElement;

        
        $scope.$watch('isVisible', function(value) {
          if(childElement) {
            $animate.leave(childElement);
            childElement = undefined;
          }
          if(childScope) {
            childScope.$destroy();
            childScope = undefined;
          }
          if(value) {
            childScope = $scope.$new();
            transclude(childScope, function(clone) {
              childElement = clone;
              childElement.addClass('view-full');
              $animate.enter(clone, $element.parent(), $element);
            });
          }
        });

        $scope.title = $attr.title;
        $scope.icon = $attr.icon;
        $scope.iconOn = $attr.iconOn;
        $scope.iconOff = $attr.iconOff;
        tabsCtrl.add($scope);

      }
    }
  };
}])


.directive('tabControllerBar', function() {
  return {
    restrict: 'E',
    require: '^tabs',
    transclude: true,
    replace: true,
    scope: true,
    template: '<div class="tabs tabs-primary">' + 
      '<tab-controller-item title="{{controller.title}}" icon="{{controller.icon}}" icon-on="{{controller.iconOn}}" icon-off="{{controller.iconOff}}" active="controller.isVisible" index="$index" ng-repeat="controller in controllers"></tab-controller-item>' + 
    '</div>'
  };
})

.directive('tabControllerItem', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '^tabs',
    scope: {
      title: '@',
      icon: '@',
      iconOn: '@',
      iconOff: '@',
      active: '=',
      tabSelected: '@',
      index: '='
    },
    link: function(scope, element, attrs, tabsCtrl) {
      if(attrs.icon) {
        scope.iconOn = scope.iconOff = attrs.icon;
      }
      scope.selectTab = function(index) {
        tabsCtrl.select(scope.index);
      };
    },
    template: 
      '<a href="#" ng-class="{active:active}" ng-click="selectTab()" class="tab-item">' +
        '<i ng-class="{{icon}}" ng-if="icon"></i>' +
        '<i class="{{iconOn}}" ng-if="active"></i>' +
        '<i class="{{iconOff}}" ng-if="!active"></i> {{title}}' +
      '</a>'
  };
})

.directive('tabBar', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<div class="tabs tabs-primary" ng-transclude>' + 
    '</div>'
  }
})

.directive('tabItem', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      title: '@',
      iconOn: '@',
      iconOff: '@',
      active: '=',
      tabSelected: '@',
      index: '='
    },
    link: function(scope, element, attrs) {
    },
    template: 
      '<a href="#" ng-class="{active:active}" ng-click="tabSelected()" class="tab-item">' +
        '<i class="{{icon}}" ng-if="icon"></i>' +
        '<i class="{{iconOn}}" ng-if="active"></i>' +
        '<i class="{{iconOff}}" ng-if="!active"></i> {{title}}' +
      '</a>'
  };
});
;
angular.module('ionic.ui.toggle', [])

// The content directive is a core scrollable content area
// that is part of many View hierarchies
.directive('toggle', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    scope: true,
    template: '<div class="toggle"><input type="checkbox"><div class="handle"></div></div>',

    link: function($scope, $element, $attr, ngModel) {
      var checkbox, handle;

      if(!ngModel) { return; }

      checkbox = $element.children().eq(0);
      handle = $element.children().eq(1);

      if(!checkbox.length || !handle.length) { return; }

      $scope.toggle = new ionic.views.Toggle({ 
        el: $element[0],
        checkbox: checkbox[0],
        handle: handle[0]
      });

      $element.bind('click', function(e) {
        $scope.toggle.tap(e);
        $scope.$apply(function() {
          ngModel.$setViewValue(checkbox[0].checked);
        });
      });

      ngModel.$render = function() {
        $scope.toggle.val(ngModel.$viewValue);
      };
    }
  };
});
;
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
            console.log('Removing', numToRemove, 'items FROM BEGIN');
            destroyItems(activeCollection, 'shift', numToRemove);
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

;
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
;

(function() {
'use strict';

// Turn the expression supplied to the directive:
//
//     a in b
//
// into `{ value: "a", collection: "b" }`
function parseRepeatExpression(expression){
  var match = expression.match(/^\s*([\$\w]+)\s+in\s+(\S*)\s*$/);
  if (! match) {
    throw new Error("Expected sfVirtualRepeat in form of '_item_ in _collection_' but got '" +
                    expression + "'.");
  }
  return {
    value: match[1],
    collection: match[2]
  };
}

// Utility to filter out elements by tag name
function isTagNameInList(element, list){
  var t, tag = element.tagName.toUpperCase();
  for( t = 0; t < list.length; t++ ){
    if( list[t] === tag ){
      return true;
    }
  }
  return false;
}


// Utility to find the viewport/content elements given the start element:
function findViewportAndContent(startElement){
  /*jshint eqeqeq:false, curly:false */
  var root = $rootElement[0];
  var e, n;
  // Somewhere between the grandparent and the root node
  for( e = startElement.parent().parent()[0]; e !== root; e = e.parentNode ){
    // is an element
    if( e.nodeType != 1 ) break;
    // that isn't in the blacklist (tables etc.),
    if( isTagNameInList(e, DONT_WORK_AS_VIEWPORTS) ) continue;
    // has a single child element (the content),
    if( e.childElementCount != 1 ) continue;
    // which is not in the blacklist
    if( isTagNameInList(e.firstElementChild, DONT_WORK_AS_CONTENT) ) continue;
    // and no text.
    for( n = e.firstChild; n; n = n.nextSibling ){
      if( n.nodeType == 3 && /\S/g.test(n.textContent) ){
        break;
      }
    }
    if( n == null ){
      // That element should work as a viewport.
      return {
        viewport: angular.element(e),
        content: angular.element(e.firstElementChild)
      };
    }
  }
  throw new Error("No suitable viewport element");
}

// Apply explicit height and overflow styles to the viewport element.
//
// If the viewport has a max-height (inherited or otherwise), set max-height.
// Otherwise, set height from the current computed value or use
// window.innerHeight as a fallback
//
function setViewportCss(viewport){
  var viewportCss = {'overflow': 'auto'},
      style = window.getComputedStyle ?
        window.getComputedStyle(viewport[0]) :
        viewport[0].currentStyle,
      maxHeight = style && style.getPropertyValue('max-height'),
      height = style && style.getPropertyValue('height');

  if( maxHeight && maxHeight !== '0px' ){
    viewportCss.maxHeight = maxHeight;
  }else if( height && height !== '0px' ){
    viewportCss.height = height;
  }else{
    viewportCss.height = window.innerHeight;
  }
  viewport.css(viewportCss);
}

// Apply explicit styles to the content element to prevent pesky padding
// or borders messing with our calculations:
function setContentCss(content){
  var contentCss = {
    margin: 0,
    padding: 0,
    border: 0,
    'box-sizing': 'border-box'
  };
  content.css(contentCss);
}

// TODO: compute outerHeight (padding + border unless box-sizing is border)
function computeRowHeight(element){
  var style = window.getComputedStyle ? window.getComputedStyle(element)
                                      : element.currentStyle,
      maxHeight = style && style.getPropertyValue('max-height'),
      height = style && style.getPropertyValue('height');

  if( height && height !== '0px' && height !== 'auto' ){
    $log.info('Row height is "%s" from css height', height);
  }else if( maxHeight && maxHeight !== '0px' && maxHeight !== 'none' ){
    height = maxHeight;
    $log.info('Row height is "%s" from css max-height', height);
  }else if( element.clientHeight ){
    height = element.clientHeight+'px';
    $log.info('Row height is "%s" from client height', height);
  }else{
    throw new Error("Unable to compute height of row");
  }
  angular.element(element).css('height', height);
  return parseInt(height, 10);
}

angular.module('ionic.ui.virtualRepeat', [])

/**
 * A replacement for ng-repeat that supports virtual lists.
 * This is not a 1 to 1 replacement for ng-repeat. However, in situations
 * where you have huge lists, this repeater will work with our virtual
 * scrolling to only render items that are showing or will be showing
 * if a scroll is made.
 */
.directive('virtualRepeat', ['$log', function($log) {
    return {
      require: ['?ngModel, ^virtualList'],
      transclude: 'element',
      priority: 1000,
      terminal: true,
      compile: function(element, attr, transclude) {
        var ident = parseRepeatExpression(attr.sfVirtualRepeat);

        return function(scope, iterStartElement, attrs, ctrls, b) {
          var virtualList = ctrls[1];

          var rendered = [];
          var rowHeight = 0;
          var sticky = false;

          var dom = virtualList.element;
          //var dom = findViewportAndContent(iterStartElement);

          // The list structure is controlled by a few simple (visible) variables:
          var state = 'ngModel' in attrs ? scope.$eval(attrs.ngModel) : {};

          function makeNewScope (idx, collection, containerScope) {
            var childScope = containerScope.$new();
            childScope[ident.value] = collection[idx];
            childScope.$index = idx;
            childScope.$first = (idx === 0);
            childScope.$last = (idx === (collection.length - 1));
            childScope.$middle = !(childScope.$first || childScope.$last);
            childScope.$watch(function updateChildScopeItem(){
              childScope[ident.value] = collection[idx];
            });
            return childScope;
          }

          // Given the collection and a start and end point, add the current
          function addElements (start, end, collection, containerScope, insPoint) {
            var frag = document.createDocumentFragment();
            var newElements = [], element, idx, childScope;
            for( idx = start; idx !== end; idx ++ ){
              childScope = makeNewScope(idx, collection, containerScope);
              element = linker(childScope, angular.noop);
              //setElementCss(element);
              newElements.push(element);
              frag.appendChild(element[0]);
            }
            insPoint.after(frag);
            return newElements;
          }

          function recomputeActive() {
            // We want to set the start to the low water mark unless the current
            // start is already between the low and high water marks.
            var start = clip(state.firstActive, state.firstVisible - state.lowWater, state.firstVisible - state.highWater);
            // Similarly for the end
            var end = clip(state.firstActive + state.active,
                           state.firstVisible + state.visible + state.lowWater,
                           state.firstVisible + state.visible + state.highWater );
            state.firstActive = Math.max(0, start);
            state.active = Math.min(end, state.total) - state.firstActive;
          }

          function sfVirtualRepeatOnScroll(evt){
            if( !rowHeight ){
              return;
            }
            // Enter the angular world for the state change to take effect.
            scope.$apply(function(){
              state.firstVisible = Math.floor(evt.target.scrollTop / rowHeight);
              state.visible = Math.ceil(dom.viewport[0].clientHeight / rowHeight);
              $log.log('scroll to row %o', state.firstVisible);
              sticky = evt.target.scrollTop + evt.target.clientHeight >= evt.target.scrollHeight;
              recomputeActive();
              $log.log(' state is now %o', state);
              $log.log(' sticky = %o', sticky);
            });
          }

          function sfVirtualRepeatWatchExpression(scope){
            var coll = scope.$eval(ident.collection);
            if( coll.length !== state.total ){
              state.total = coll.length;
              recomputeActive();
            }
            return {
              start: state.firstActive,
              active: state.active,
              len: coll.length
            };
          }

          function destroyActiveElements (action, count) {
            var dead, ii, remover = Array.prototype[action];
            for( ii = 0; ii < count; ii++ ){
              dead = remover.call(rendered);
              dead.scope().$destroy();
              dead.remove();
            }
          }

          // When the watch expression for the repeat changes, we may need to add
          // and remove scopes and elements
          function destroyActiveElements (action, count) {
            var dead, ii, remover = Array.prototype[action];
            for( ii = 0; ii < count; ii++ ){
              dead = remover.call(rendered);
              dead.scope().$destroy();
              dead.remove();
            }
          }
          function sfVirtualRepeatListener(newValue, oldValue, scope){
            // Grab the collection, computing the end value as the old start
            // plus how many are active
            var oldEnd = oldValue.start + oldValue.active,
                collection = scope.$eval(ident.collection),
                newElements;

            // If the new value and old value are the same, I think that's the first time?
            if(newValue === oldValue) {
              $log.info('initial listen');
              
              // Create new elements, appending them all after the start of this list
              newElements = addElements(newValue.start, oldEnd, collection, scope, iterStartElement);
              rendered = newElements;
              if(rendered.length) {
                rowHeight = computeRowHeight(newElements[0][0]);
              }
            } else {

              // Find the new end point, which is just the start plus the active
              var newEnd = newValue.start + newValue.active;

              // Is this a forward movement? New.start is after old.start
              var forward = newValue.start >= oldValue.start;

              // Calculate the number of items we've moved up or down
              var delta = forward ? newValue.start - oldValue.start
                                  : oldValue.start - newValue.start;

              // Calculate the number of items at the end that we've moved up or down
              var endDelta = newEnd >= oldEnd ? newEnd - oldEnd : oldEnd - newEnd;

              // Check if we've changed by an amount that is greater than the active elements,
              // which would mean we have to remove all the elements and add them again
              var contiguous = delta < (forward ? oldValue.active : newValue.active);
              $log.info('change by %o,%o rows %s', delta, endDelta, forward ? 'forward' : 'backward');


              if(!contiguous) {
                $log.info('non-contiguous change');
                // Remove all the old elements
                destroyActiveElements('pop', rendered.length);

                // Add our new ones back again
                rendered = addElements(newValue.start, newEnd, collection, scope, iterStartElement);

              } else {

                // THIS IS A NORMAL SITUATION


                if(forward) {
                  // We are moving forward
                  $log.info('need to remove from the top');

                  // Remove the number we've moved forward from the beginning of the list
                  destroyActiveElements('shift', delta);

                } else if(delta) {

                  // We've moved back, so add new elements to the top of the list

                  $log.info('need to add at the top');
                  newElements = addElements(
                    newValue.start,
                    oldValue.start,
                    collection, scope, iterStartElement);

                  // Add the new rendered elements to the old ones
                  rendered = newElements.concat(rendered);
                }

                // If we've moved UP
                if(newEnd < oldEnd) {
                  $log.info('need to remove from the bottom');
                  destroyActiveElements('pop', oldEnd - newEnd);

                } else if(endDelta) {
                  // Otherwise, if we've moved down, add them to the bottom
                  var lastElement = rendered[rendered.length-1];
                  $log.info('need to add to the bottom');
                  newElements = addElements(
                    oldEnd,
                    newEnd,
                    collection, scope, lastElement);
                  rendered = rendered.concat(newElements);
                }
              }

              // Row height changed?
              if(!rowHeight && rendered.length) {
                rowHeight = computeRowHeight(rendered[0][0]);
              }

              // Add padding at the top for scroll bars
              dom.content.css({'padding-top': newValue.start * rowHeight + 'px'});
            }

            // Set the height so it looks right
            dom.content.css({'height': newValue.len * rowHeight + 'px'});
            if(sticky) {
              dom.viewport[0].scrollTop = dom.viewport[0].clientHeight + dom.viewport[0].scrollHeight;
            }
          }

          //  - The index of the first active element
          state.firstActive = 0;
          //  - The index of the first visible element
          state.firstVisible = 0;
          //  - The number of elements visible in the viewport.
          state.visible = 0;
          // - The number of active elements
          state.active = 0;
          // - The total number of elements
          state.total = 0;
          // - The point at which we add new elements
          state.lowWater = state.lowWater || 100;
          // - The point at which we remove old elements
          state.highWater = state.highWater || 300;
          // TODO: now watch the water marks

          setContentCss(dom.content);
          setViewportCss(dom.viewport);
          // When the user scrolls, we move the `state.firstActive`
          dom.bind('momentumScrolled', sfVirtualRepeatOnScroll);

          // The watch on the collection is just a watch on the length of the
          // collection. We don't care if the content changes.
          scope.$watch(sfVirtualRepeatWatchExpression, sfVirtualRepeatListener, true);
        }
      }
    };
  }]);

})(ionic);
