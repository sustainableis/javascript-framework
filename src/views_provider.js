(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the views inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = function($log, $compile, $ocLazyLoad, $q, $rootScope, dataStore,
      sisModules) {
      var _this = this;

      /**
       * Builds an internal list with modules embedded on the page and loads
       * script files
       */
      var _init = function(callback) {
        var views = angular.element('.__view__'),
          requests = [];

        _.each(views, function(view) {
          var id = angular.element(view).data('id'),
            version = angular.element(view).data('version'),
            tag = angular.element(view).prop('tagName').toLowerCase(),
            path = sisModules.path + '/dist/' + tag + '/' + version + '/' + tag + '.min',
            request = $q.defer();

          $ocLazyLoad.load({
            serie: true,
            files: [
              // Preload the html template
              path + '.html',
              path + '.js',
              path + '.css'
            ]
          }).then(function() {
            dataStore.get('service:views/id:' + id + '/controller:modules',
              function(modules, error) {
                var placeholders = $(tag + ' .placeholder');

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {
                    placeholder: placeholder.id
                  });

                  if (module) {
                    var module_markup = '<' + module.slug + ' class="module" data-id="' +
                      module.id + '" data-version="' + module.version + '">';

                    module_element = $compile(module_markup)($rootScope);

                    angular.element(placeholder).empty();
                    angular.element(placeholder).append(module_element);
                  }
                });

                request.resolve();
              }
            );
          }, function() {
            $log.error('Module', tag, ':', id, '@', version, 'is missing files');
          });

          $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
            if (file === path + '.js') {
              $compile(view)($rootScope);
            }
          });

          requests.push(request.promise);
        });

        $q.all(requests).then(callback);
      };

      return {
        init: _init
      };
    };
  });
})(window.angular, window.events, window._, window.$);
