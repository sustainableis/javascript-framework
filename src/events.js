(function() {
  var topics = {};

  var _subscribe = function(topic, listener) {
    if (!topics[topic]) {
      topics[topic] = {
        queue: []
      }
    }

    topics[topic].queue.push(listener);
  }

  var _unsubscribe = function(index) {
    delete topics[topic].queue[index];
  }

  var _publish = function(topic, message) {
    var message = message || {};

    if (!topics[topic] || !topics[topic].queue.length) {
      return;
    }

    topics[topic].queue.forEach(function(listener) {
      listener(message);
    });
  }

  window.events = {
    subscribe: _subscribe,
    unsubscribe: _unsubscribe,
    publish: _publish,
    topics: topics
  };
})();