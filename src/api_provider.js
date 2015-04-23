(function(angular) {
  /**
   * Provider for configuring sis.api variables
   */
  angular.module('sis.api').provider('sisApi', function() {
    this.url = 'http://api.sustainableis.com/';
    this.version = 'v1';

    this.$get = function() {
      return {
        url: this.url,
        version: this.version
      };
    };
  });
})(window.angular);
