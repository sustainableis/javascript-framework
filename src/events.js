(function() {
  var topics = {};

  var _subscribe = function(topic, listener) {
    if (!topics.hasOwnProperty(topic)) {
      topics[topic] = [];
    }

    var index = topics[topic].push(listener) - 1;

    return {
      remove: function() {
        delete topics[topic][index];
      }
    };
  };

  var _publish = function(topic, message) {
    if (!topics.hasOwnProperty(topic)) {
      return;
    }

    var _message = message || {};

    topics[topic].forEach(function(listener) {
      listener(_message);
    });
  };

  var _purge = function() {
    topics = {};
  };

  window.events = {
    subscribe: _subscribe,
    publish: _publish,
    purge: _purge,
    topics: topics
  };
})();
