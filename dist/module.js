/* socket-request-client version 0.1.0 */
const ENVIRONMENT = {version: '0.1.0', production: true};

/**
 * PubSub.js
 * Javascript implementation of the Publish/Subscribe pattern.
 *
 * @version 3.4.0
 * @author George Raptis <georapbox@gmail.com> (georapbox.github.io)
 * @homepage https://github.com/georapbox/PubSub#readme
 * @repository https://github.com/georapbox/PubSub.git
 * @license MIT
 */
(function (name, context, definition) {
  if (typeof define === 'function' && define.amd) {
    define(definition);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = definition();
  } else {
    context[name] = definition(name, context);
  }
}('PubSub', undefined, function (name, context) {
  var VERSION = '3.4.0';
  var OLD_PUBLIC_API = (context || {})[name];
  function forOwn(obj, callback, thisArg) {
    var key;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (callback && callback.call(thisArg, obj[key], key, obj) === false) {
          return;
        }
      }
    }
    return obj;
  }
  function alias(fn) {
    return function closure() {
      return this[fn].apply(this, arguments);
    };
  }
  function deliverTopic(instance, topic, data) {
    var topics = instance._pubsub_topics;
    var subscribers = topics[topic] ? topics[topic].slice(0) : [];
    var i = 0;
    var len = subscribers.length;
    var currentSubscriber, token;
    for (; i < len; i += 1) {
      token = subscribers[i].token;
      currentSubscriber = subscribers[i];
      currentSubscriber.callback(data, {
        name: topic,
        token: token
      });
      if (currentSubscriber.once === true) {
        instance.unsubscribe(token);
      }
    }
  }
  function publishData(args) {
    var dataArgs = Array.prototype.slice.call(args, 1);
    return dataArgs.length <= 1 ? dataArgs[0] : dataArgs;
  }
  function publish(instance, topic, data, sync) {
    var topics = instance._pubsub_topics;
    if (!topics[topic]) {
      return false;
    }
    sync ? deliverTopic(instance, topic, data) : setTimeout(function () {
      deliverTopic(instance, topic, data);
    }, 0);
    return true;
  }
  function PubSub() {
    if (!(this instanceof PubSub)) {
      return new PubSub();
    }
    this._pubsub_topics = {};
    this._pubsub_uid = -1;
    return this;
  }
  PubSub.prototype.subscribe = function (topic, callback, once) {
    var topics = this._pubsub_topics;
    var token = this._pubsub_uid += 1;
    var obj = {};
    if (typeof callback !== 'function') {
      throw new TypeError('When subscribing for an event, a callback function must be defined.');
    }
    if (!topics[topic]) {
      topics[topic] = [];
    }
    obj.token = token;
    obj.callback = callback;
    obj.once = !!once;
    topics[topic].push(obj);
    return token;
  };
  PubSub.prototype.subscribeOnce = function (topic, callback) {
    return this.subscribe(topic, callback, true);
  };
  PubSub.prototype.publish = function (topic             ) {
    return publish(this, topic, publishData(arguments), false);
  };
  PubSub.prototype.publishSync = function (topic             ) {
    return publish(this, topic, publishData(arguments), true);
  };
  PubSub.prototype.unsubscribe = function (topic) {
    var topics = this._pubsub_topics;
    var tf = false;
    var prop, len;
    for (prop in topics) {
      if (Object.prototype.hasOwnProperty.call(topics, prop)) {
        if (topics[prop]) {
          len = topics[prop].length;
          while (len) {
            len -= 1;
            if (topics[prop][len].token === topic) {
              topics[prop].splice(len, 1);
              if (topics[prop].length === 0) {
                delete topics[prop];
              }
              return topic;
            }
            if (prop === topic) {
              topics[prop].splice(len, 1);
              if (topics[prop].length === 0) {
                delete topics[prop];
              }
              tf = true;
            }
          }
          if (tf === true) {
            return topic;
          }
        }
      }
    }
    return false;
  };
  PubSub.prototype.unsubscribeAll = function () {
    this._pubsub_topics = {};
    return this;
  };
  PubSub.prototype.hasSubscribers = function (topic) {
    var topics = this._pubsub_topics;
    var hasSubscribers = false;
    if (topic == null) {
      forOwn(topics, function (value, key) {
        if (key) {
          hasSubscribers = true;
          return false;
        }
      });
      return hasSubscribers;
    }
    return Object.prototype.hasOwnProperty.call(topics, topic);
  };
  PubSub.prototype.subscribers = function () {
    var res = {};
    forOwn(this._pubsub_topics, function (topicValue, topicKey) {
      res[topicKey] = topicValue.slice(0);
    });
    return res;
  };
  PubSub.prototype.subscribersByTopic = function (topic) {
    return this._pubsub_topics[topic] ? this._pubsub_topics[topic].slice(0) : [];
  };
  PubSub.prototype.alias = function (aliasMap) {
    forOwn(aliasMap, function (value, key) {
      if (PubSub.prototype[key]) {
        PubSub.prototype[aliasMap[key]] = alias(key);
      }
    });
    return this;
  };
  PubSub.noConflict = function noConflict() {
    if (context) {
      context[name] = OLD_PUBLIC_API;
    }
    return PubSub;
  };
  PubSub.version = VERSION;
  return PubSub;
}));

var PubSub = /*#__PURE__*/Object.freeze({

});

const socketRequestClient = (port = 6000, protocol = 'echo-protocol', WebSocket) => {
  const pubsub = new PubSub();
  const onerror = error => {
    pubsub.publish('error', error);
  };
  const onmessage = message => {
    const {value, url, status} = JSON.parse(message.data.toString());
    if (status === 200) {
      pubsub.publish(url, value);
    } else {
      onerror(`Failed requesting ${type} @onmessage`);
    }
  };
  const send = (client, request) => {
    client.send(Buffer.from(JSON.stringify(request)));
  };
  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  };
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      on(request.url, result => {
        resolve(result);
      });
      send(client, request);
    });
  };
  const clientConnection = client => {
    return {
      request: req => request(client, req),
      send: req => send(client, req),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit();
        };
        client.close();
      }
    }
  };
  return new Promise(resolve => {
    const init = () => {
      const client = new WebSocket(`ws://localhost:${port}/`, protocol);
      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => resolve(clientConnection(client));
      client.onclose = message => {
        console.log(`${protocol} Client Closed`);
        if (message.code === 1006) {
          console.log('Retrying in 3 seconds');
          setTimeout(() => {
            return init();
          }, 3000);
        }
      };
    };
    return init();
  });
};

export default socketRequestClient;
