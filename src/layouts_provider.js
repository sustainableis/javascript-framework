(function(angular, _, $) {
  /**
   * Factory for handling layout modules
   */
  angular.module('sis.modules').provider('sisLayouts', function() {

    this.$get = function($q, $log, $timeout, sisModules, LayoutsService) {
      var _layout_modules = [];

      /**
       * Fetches layout modules
       */
      var _fetch_modules = function(layout_id) {

        var fetch_modules_deferred = $q.defer();
        var layout_modules_resource = LayoutsService.query({
          id: layout_id,
          controller: 'modules'
        });

        layout_modules_resource.$promise
          .then(function(modules) {
            _layout_modules = _.clone(modules);
            fetch_modules_deferred.resolve();
          });

        return fetch_modules_deferred.promise;
      };

      var _append_modules = function(scope) {
        var append_deferred = $q.defer();
        var placeholders = $('.placeholder');

        _.each(placeholders, function(placeholder) {
          console.log('PLACEHOLDER', placeholder);
          var module = _.find(_layout_modules, {
            placeholder: placeholder.id
          });
          console.log('MODULE', module);
          sisModules
            .append({
              container: '#' + placeholder.id,
              slug: module.slug,
              id: module.id,
              version: '0.0.1',
              transclude: true,
              scope: scope
            });
        });

        append_deferred.resolve();
        return append_deferred.promise;
      };

      return {
        fetch_modules: _fetch_modules,
        append_modules: _append_modules
      };
    };
  });
})(window.angular, window._, window.$);
