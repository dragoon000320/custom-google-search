'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // String prototype format override: for easy format method
  String.prototype.format = function () {
    var formatted = this;
    for (var arg in arguments) {
      formatted = formatted.replace('{' + arg + '}', arguments[arg]);
    }
    return formatted;
  };

  // Service to store actual query and indices of actual pages in both web and image searches
  var store = (function () {
    var _query = '';
    var _imgPage = 0;
    var _webPage = 0;
    return {
      getQuery: function () {
        return _query;
      },
      setQuery: function (query) {
        _query = query;
      },
      getImgPage: function () {
        return _imgPage;
      },
      nextImgPage: function () {
        return _imgPage = ++_imgPage > 23 ? 23 : _imgPage;
      },
      prevImgPage: function () {
        return _imgPage = --_imgPage < 0 ? 0 : _imgPage;
      },
      defImgPage: function () {
        _imgPage = 0;
      },
      getWebPage: function () {
        return _webPage;
      },
      nextWebPage: function () {
        return _webPage = ++_webPage > 23 ? 23 : _webPage;
      },
      prevWebPage: function () {
        return _webPage = --_webPage < 0 ? 0 : _webPage;
      },
      defWebPage: function () {
        _webPage = 0;
      }
    };
  })();

  // Constants and templates
  var webResultTemplate = '<div id="web-res{0}" class="web-res"><div class="title">{1}</div>' +
    '<a class="ref" href="{2}" target="_blank">{3}</a><p class="paragraph">{4}</p></div>\n';
  var imgResultTemplate = '<a id="imgRef{0}" href="{1}" target="_blank"><img class="img-res" src="{2}"/></a>';
  var paginationTemplate = '<div class="pagination m-1"><a id="prevPage">⇠</a><a id="currentPage{0}">{1}</a>' +
    '<a id="nextPage">⇢</a></div>';
  var errorMessage = 'Sorry, something wrong happened while processing your {0} request. ' +
    'You can try again later. Response from the server:\r\n{1}';
  var googleApiRequest = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCuHWvYhUXDMLtZqT7V76qzFgv0ov4ATFo' +
    '&cx=006315541262340538026:zh1ntmntkfw&q={0}&prettyPrint=false&start={1}&num={2}';
  var webContent = document.getElementById('web-content');
  var imgContent = document.getElementById('img-content');
  var queryInput = document.getElementById('query-input');

  // Simple error handler
  var handleError = function (response, imageSearch) {
    alert(errorMessage.format(imageSearch ? 'image search': 'web page search',
      response ? response.toString() : 'empty'));
    return;
  };

  // Simple ajax get request
  var ajaxGet = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          callback(xhr.responseText);
        } else {
          handleError(xhr.responseText, url.indexOf('&searchType=image') !== -1);
        }
      }
    };
    xhr.open('GET', url, true);
    xhr.send();
  };

  // Web pages search handler
  var searchWebResults = function (query, page, count) {
    ajaxGet(googleApiRequest.format(query, page * count + 1, count), function (res) {
      store.setQuery(query);
      var results = JSON.parse(res).items;
      var i;
      // If DOM already exists just override data in DOMs
      if (webContent.innerHTML) {
        for (i = 0; i <= results.length; i++) {
          if (i === results.length) {
            document.getElementById('currentPageWeb').text = page + 1;
          } else {
            var webRes = document.getElementById('web-res' + i);
            var ref = webRes.querySelector('.ref');
            webRes.querySelector('.title').innerHTML = results[i].htmlTitle;
            ref.href = results[i].link;
            ref.innerHTML = results[i].displayLink;
            webRes.querySelector('.paragraph').innerHTML = results[i].htmlSnippet.replace(/<br\s*\/?>/gi,' ');
          }
        }
      } else {
        for (i = -1; i <= results.length; i++) {
          webContent.innerHTML += i === -1 ? '<div class="caption m-1">Web Results</div>' :
            (i === results.length ?
              paginationTemplate.format('Web', page + 1) :
              webResultTemplate.format(i, results[i].htmlTitle, results[i].link,
                results[i].displayLink, results[i].htmlSnippet.replace(/<br\s*\/?>/gi,' ')));
        }
      }
    });
  };

  // Images search handler
  var searchImgResults = function (query, page, count) {
    ajaxGet(googleApiRequest.format(query, page * count + 1, count) + '&searchType=image', function (res) {
      store.setQuery(query);
      var results = JSON.parse(res).items;
      var i;
      // If DOM already exists just override data in DOMs
      if (imgContent.innerHTML) {
        for (i = 0; i <= results.length; i++) {
          if (i === results.length) {
            document.getElementById('currentPageImg').text = page + 1;
          } else {
            var imgRes = document.getElementById('imgRef' + i);
            imgRes.querySelector('.img-res').src = results[i].image.thumbnailLink;
            imgRes.href = results[i].image.contextLink;
          }
        }
      } else {
        for (i = -1; i <= results.length; i++) {
          imgContent.innerHTML += i === -1 ? '<div class="caption m-1">Image Results</div>' :
            (i === results.length ?
              paginationTemplate.format('Img', page + 1) :
              imgResultTemplate.format(i, results[i].image.contextLink, results[i].image.thumbnailLink));
        }
      }
    });
  };

  // Event listeners
  document.getElementById('search-button').onclick = function () {
    if (queryInput.value) {
      searchWebResults(queryInput.value, 0, 4);
      searchImgResults(queryInput.value, 0, 9);
      store.defImgPage();
      store.defWebPage();
    }
  };

  queryInput.onkeypress = function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (queryInput.value) {
        searchWebResults(queryInput.value, 0, 4);
        searchImgResults(queryInput.value, 0, 9);
        store.defWebPage();
        store.defImgPage();
      }
    }
  };

  webContent.addEventListener('click', function (e) {
    if (e.target.id === 'nextPage') {
      if (store.getWebPage() < 23) {
        searchWebResults(store.getQuery(), store.nextWebPage(), 4);
      }
    }
    if (e.target.id == 'prevPage') {
      if (store.getWebPage() > 0) {
        searchWebResults(store.getQuery(), store.prevWebPage(), 4);
      }
    }
  }, false);

  imgContent.addEventListener('click', function (e) {
    if (e.target.id === 'nextPage') {
      if (store.getImgPage() < 23) {
        searchImgResults(store.getQuery(), store.nextImgPage(), 9);
      }
    }
    if (e.target.id == 'prevPage') {
      if (store.getImgPage() > 0) {
        searchImgResults(store.getQuery(), store.prevImgPage(), 9);
      }
    }
  }, false);
});
