// this uses a cannibalized version of https://www.npmjs.com/package/reactjs-infinite-scroll

import { apiFetch } from "./utils/apiFetch.js";

let doInfiniteScroll = true

export async function main() {
  console.log('infinite scroll loaded');
}

export async function clean() {

}

const realDefineProperty = Object.defineProperty.bind(Object);
Object.defineProperty = function (object, key, descriptor) {
  return realDefineProperty(object, key, {
    ...descriptor,
    configurable:
      typeof descriptor.configurable === "boolean"
        ? descriptor.configurable
        : key !== "prototype",
  });
};

apiFetch

let displayPrefs;
(async () => {
  const res = await fetch('https://cohost.org/api/v1/trpc/users.displayPrefs')
  displayPrefs = (await res.json()).result.data
})();


if (!window.__LOADABLE_LOADED_CHUNKS__) {
  window.__LOADABLE_LOADED_CHUNKS__ = []
}
window.__LOADABLE_LOADED_CHUNKS__.push([
  [3133742069],
  {
    3133742069: (module, exports, require) => {

      const realGetElementById = document.getElementById;
      Object.defineProperty(document, "getElementById", {
        value(id) {
          if (id == 'app') {
            const findLoadedModules = (check) =>
              window.__LOADABLE_LOADED_CHUNKS__
                .map((e) => Object.keys(e[1]))
                .flat()
                .map((e) => require(e))
                .filter(check);
            const React = (window.React = findLoadedModules(
              (e) => e && e.createElement && e.useState
            )[0]);

            const InfiniteScroll = makeInfiniteScroll(React)
            const ErrorBoundary = makeErrorBoundary(React)

            const realCreateElement = React.createElement;
            Object.defineProperty(React, "createElement", {
              value(type, props, ...children) {

                if (props?.className == 'flex flex-col gap-12' && doInfiniteScroll) {
                  // IF IN THIS CASE THEN WE ARE IN THE FEED
                  attachInfiniteScroll({
                    InfiniteScroll,
                    ErrorBoundary,
                    React,
                    type,
                    props,
                    children,
                  })
                }

                return realCreateElement.call(React, type, props, ...children);
              },
            });
          }
          return realGetElementById.call(document, id)
        },
      });
    },
  },
  (r) => r(3133742069),
]);

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function makeErrorBoundary() {
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        return this.props.fallback;
      }

      return this.props.children;
    }
  }
  return ErrorBoundary
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function attachInfiniteScroll({
  InfiniteScroll,
  ErrorBoundary,
  React,
  type,
  props,
  children,
}) {
  // console.log('Before Changes')
  // console.log(type)
  // console.log(props)
  // console.log(children.concat())
  const isMainFeed = children.length > 2 // if it's not main feed then it's bookmarks feed
  let RenderIfVisible = null;
  let PostPreviewChooser = null;

  const feed = isMainFeed ? children[1] : children[0]
  const paginationIdx = isMainFeed ? 3 : 1
  // console.log('feed', feed)
  // console.log('pagination', children[paginationIdx]);
  if (feed.length) {
    RenderIfVisible = feed[0].type
    PostPreviewChooser = feed[0].props.children.type
    // console.log(PostPreviewChooser)
  }

  const [posts, setPosts] = React.useState([])

  const [loading, setLoading] = React.useState(false)

  // console.log('pagination link?', children[paginationIdx])
  const [skipPosts, setSkipPosts] = React.useState(0);

  const [nextPageURL, setNextPageURL] = React.useState(
    isMainFeed
      ? children[paginationIdx].props.forwardLink
      : `https://cohost.org/rc/bookmarks?beforeTime=${children[paginationIdx].props.paginationMode.beforeTime}`
  )

  // console.log('nextPageURL', nextPageURL)

  function loadFunc() {
    if (loading) return
    setLoading(true)
    let nextPageLink = new URL(nextPageURL);
    if (isMainFeed)
      nextPageLink.searchParams.set('skipPosts', skipPosts)
    fetch(nextPageLink.toString()).then(r => r.text()).then(r => {
      // console.log('next page', nextPageLink.toString())
      const parser = new DOMParser();
      const page = parser.parseFromString(r, 'text/html')
      const feedData = JSON.parse(page.querySelector('script[id=__COHOST_LOADER_STATE__]').innerText)
      // console.log('aaa???', feedData)
      if (!isMainFeed) {
        setNextPageURL(`https://cohost.org/rc/bookmarks?beforeTime=${feedData['bookmarked-tag-feed'].paginationMode.beforeTime}`)
      }
      setPosts(posts => {
        const key = isMainFeed ? 'dashboard-nonlive-post-feed' : 'bookmarked-tag-feed'
        const newPosts = feedData[key]?.posts
        return posts.concat(newPosts)
      })
      setSkipPosts(skipPosts => skipPosts + 20)
      setLoading(false)
    })
  }

  const pagination = children[paginationIdx];
  children[paginationIdx] = null;

  const infScroll = React.createElement(InfiniteScroll, {
    initialLoad: true,
    pageStart: 0,
    loadMore: loadFunc,
    hasMore: true,
    threshold: 5000,
    loader: React.createElement("div", { className: "loader", key: 0 }, "Loading ..."),
    className: 'flex flex-col gap-12 meow~',
  }, posts.map((post) => {
    return React.createElement(RenderIfVisible, { key: post.postId, initialVisible: true, stayRendered: true },
      React.createElement(PostPreviewChooser, { viewModel: post, displayPrefs: displayPrefs, highlightedTags: [] })
    )
  }))
  // console.log('After Changes')
  // console.log(type)
  // console.log(props)
  // console.log(children)

  const errBoundaryProps = {
    children: infScroll,
    fallback: pagination,
  };
  children[paginationIdx] = React.createElement(ErrorBoundary, errBoundaryProps)
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function makeInfiniteScroll(React) {
  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  var _react = React

  var _react2 = { default: React }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
      target[i] = obj[i];
    }
    return target;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      );
    }
    return call && (typeof call === 'object' || typeof call === 'function')
      ? call
      : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      throw new TypeError(
        'Super expression must either be null or a function, not ' + typeof superClass
      );
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass)
      Object.setPrototypeOf
        ? Object.setPrototypeOf(subClass, superClass)
        : (subClass.__proto__ = superClass);
  }

  var InfiniteScroll = (function (_Component) {
    _inherits(InfiniteScroll, _Component);

    function InfiniteScroll(props) {
      _classCallCheck(this, InfiniteScroll);

      var _this = _possibleConstructorReturn(
        this,
        (InfiniteScroll.__proto__ || Object.getPrototypeOf(InfiniteScroll)).call(
          this,
          props
        )
      );

      _this.scrollListener = _this.scrollListener.bind(_this);
      _this.eventListenerOptions = _this.eventListenerOptions.bind(_this);
      _this.mousewheelListener = _this.mousewheelListener.bind(_this);
      return _this;
    }

    _createClass(InfiniteScroll, [
      {
        key: 'componentDidMount',
        value: function componentDidMount() {
          this.pageLoaded = this.props.pageStart;
          this.options = this.eventListenerOptions();
          this.attachScrollListener();
        }
      },
      {
        key: 'componentDidUpdate',
        value: function componentDidUpdate() {
          if (this.props.isReverse && this.loadMore) {
            var parentElement = this.getParentElement(this.scrollComponent);
            parentElement.scrollTop =
              parentElement.scrollHeight -
              this.beforeScrollHeight +
              this.beforeScrollTop;
            this.loadMore = false;
          }
          this.attachScrollListener();
        }
      },
      {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this.detachScrollListener();
          this.detachMousewheelListener();
        }
      },
      {
        key: 'isPassiveSupported',
        value: function isPassiveSupported() {
          var passive = false;

          var testOptions = {
            get passive() {
              passive = true;
            }
          };

          try {
            document.addEventListener('test', null, testOptions);
            document.removeEventListener('test', null, testOptions);
          } catch (e) {
            // ignore
          }
          return passive;
        }
      },
      {
        key: 'eventListenerOptions',
        value: function eventListenerOptions() {
          var options = this.props.useCapture;

          if (this.isPassiveSupported()) {
            options = {
              useCapture: this.props.useCapture,
              passive: true
            };
          } else {
            options = {
              passive: false
            };
          }
          return options;
        }

        // Set a defaut loader for all your `InfiniteScroll` components
      },
      {
        key: 'setDefaultLoader',
        value: function setDefaultLoader(loader) {
          this.defaultLoader = loader;
        }
      },
      {
        key: 'detachMousewheelListener',
        value: function detachMousewheelListener() {
          var scrollEl = window;
          if (this.props.useWindow === false) {
            scrollEl = this.scrollComponent.parentNode;
          }

          scrollEl.removeEventListener(
            'mousewheel',
            this.mousewheelListener,
            this.options ? this.options : this.props.useCapture
          );
        }
      },
      {
        key: 'detachScrollListener',
        value: function detachScrollListener() {
          var scrollEl = window;
          if (this.props.useWindow === false) {
            scrollEl = this.getParentElement(this.scrollComponent);
          }

          scrollEl.removeEventListener(
            'scroll',
            this.scrollListener,
            this.options ? this.options : this.props.useCapture
          );
          scrollEl.removeEventListener(
            'resize',
            this.scrollListener,
            this.options ? this.options : this.props.useCapture
          );
        }
      },
      {
        key: 'getParentElement',
        value: function getParentElement(el) {
          var scrollParent =
            this.props.getScrollParent && this.props.getScrollParent();
          if (scrollParent != null) {
            return scrollParent;
          }
          return el && el.parentNode;
        }
      },
      {
        key: 'filterProps',
        value: function filterProps(props) {
          return props;
        }
      },
      {
        key: 'attachScrollListener',
        value: function attachScrollListener() {
          var parentElement = this.getParentElement(this.scrollComponent);

          if (!this.props.hasMore || !parentElement) {
            return;
          }

          var scrollEl = window;
          if (this.props.useWindow === false) {
            scrollEl = parentElement;
          }

          scrollEl.addEventListener(
            'mousewheel',
            this.mousewheelListener,
            this.options ? this.options : this.props.useCapture
          );
          scrollEl.addEventListener(
            'scroll',
            this.scrollListener,
            this.options ? this.options : this.props.useCapture
          );
          scrollEl.addEventListener(
            'resize',
            this.scrollListener,
            this.options ? this.options : this.props.useCapture
          );

          if (this.props.initialLoad) {
            this.scrollListener();
          }
        }
      },
      {
        key: 'mousewheelListener',
        value: function mousewheelListener(e) {
          // Prevents Chrome hangups
          // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
          if (e.deltaY === 1 && !this.isPassiveSupported()) {
            e.preventDefault();
          }
        }
      },
      {
        key: 'scrollListener',
        value: function scrollListener() {
          var el = this.scrollComponent;
          var scrollEl = window;
          var parentNode = this.getParentElement(el);

          var offset = void 0;
          if (this.props.useWindow) {
            var doc =
              document.documentElement ||
              document.body.parentNode ||
              document.body;
            var scrollTop =
              scrollEl.pageYOffset !== undefined
                ? scrollEl.pageYOffset
                : doc.scrollTop;
            if (this.props.isReverse) {
              offset = scrollTop;
            } else {
              offset = this.calculateOffset(el, scrollTop);
            }
          } else if (this.props.isReverse) {
            offset = parentNode.scrollTop;
          } else {
            offset =
              el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
          }

          // Here we make sure the element is visible as well as checking the offset
          if (
            offset < Number(this.props.threshold) &&
            el &&
            el.offsetParent !== null
          ) {
            this.detachScrollListener();
            this.beforeScrollHeight = parentNode.scrollHeight;
            this.beforeScrollTop = parentNode.scrollTop;
            // Call loadMore after detachScrollListener to allow for non-async loadMore functions
            if (typeof this.props.loadMore === 'function') {
              this.props.loadMore((this.pageLoaded += 1));
              this.loadMore = true;
            }
          }
        }
      },
      {
        key: 'calculateOffset',
        value: function calculateOffset(el, scrollTop) {
          if (!el) {
            return 0;
          }

          return (
            this.calculateTopPosition(el) +
            (el.offsetHeight - scrollTop - window.innerHeight)
          );
        }
      },
      {
        key: 'calculateTopPosition',
        value: function calculateTopPosition(el) {
          if (!el) {
            return 0;
          }
          return el.offsetTop + this.calculateTopPosition(el.offsetParent);
        }
      },
      {
        key: 'render',
        value: function render() {
          var _this2 = this;

          var renderProps = this.filterProps(this.props);

          var children = renderProps.children,
            element = renderProps.element,
            hasMore = renderProps.hasMore,
            initialLoad = renderProps.initialLoad,
            isReverse = renderProps.isReverse,
            loader = renderProps.loader,
            loadMore = renderProps.loadMore,
            pageStart = renderProps.pageStart,
            threshold = renderProps.threshold,
            useCapture = renderProps.useCapture,
            useWindow = renderProps.useWindow,
            getScrollParent = renderProps.getScrollParent,
            props = _objectWithoutProperties(renderProps, [
              'children',
              'element',
              'hasMore',
              'initialLoad',
              'isReverse',
              'loader',
              'loadMore',
              'pageStart',
              'threshold',
              'useCapture',
              'useWindow',
              'getScrollParent'
            ]);

          props.ref = function (node) {
            _this2.scrollComponent = node;
          };

          var childrenArray = [children];
          if (hasMore) {
            if (loader) {
              isReverse
                ? childrenArray.unshift(loader)
                : childrenArray.push(loader);
            } else if (this.defaultLoader) {
              isReverse
                ? childrenArray.unshift(this.defaultLoader)
                : childrenArray.push(this.defaultLoader);
            }
          }
          return _react2.default.createElement(element, props, childrenArray);
        }
      }
    ]);

    return InfiniteScroll;
  })(_react.Component);

  InfiniteScroll.defaultProps = {
    element: 'div',
    hasMore: false,
    initialLoad: true,
    pageStart: 0,
    threshold: 250,
    useWindow: true,
    isReverse: false,
    useCapture: false,
    loader: null,
    getScrollParent: null
  };

  return InfiniteScroll
}