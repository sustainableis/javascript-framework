(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the views inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = function($log, $compile, $rootScope, $ocLazyLoad, dataStore,
      sisModules) {
      var _this = this;

      /**
       * Search for the view
       */
      var _load = function(options, callback) {
        // TODO: Check if view for facilities, buildings, or organizations
        dataStore.get('service:facilities/id:' + options.id +
          '/controller:views/slug:' + options.slug,
          function(views, error) {
            // TODO: Make sure the first view is the right one
            var view = views[0];

            dataStore.get('@service:layouts/id:' + view.layout_id,
              function(layout, error) {
                var path = sisModules.path + '/dist/' + layout.slug + '/' +
                  layout.version + '/' + layout.slug + '.min';

                $rootScope.tpl = path + '.html';

                $ocLazyLoad.load({
                  files: [
                    path + '.css'
                  ]
                });

                $rootScope.$on('$includeContentLoaded', function() {
                  dataStore.get('service:views/id:' + view.id + '/controller:modules',
                    function(modules, error) {
                      var placeholders = $('.placeholder');

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

                      callback();
                    }
                  );
                });
              });
          }
        );
      };

      return {
        load: _load,
      };
    };
  });
})(window.angular, window.events, window._, window.$);
