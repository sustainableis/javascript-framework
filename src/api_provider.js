(function(angular) {
  /**
   * Provider for configuring sis.api variables
   */
  angular.module('sis.api').provider('sisApi', function() {
    this.url = 'http://api.sustainableis.com/';
    this.version = 'v1';
    this.services = {};
    this.baseUrl = 'api.sustainableis.com';

    this.$get = function() {
      var parser = document.createElement('a');
      parser.href = this.url;
      
      return {
        url: this.url,
        version: this.version,
        services: this.services,
        baseUrl: parser.hostname
      };
    };
  });
})(window.angular);
