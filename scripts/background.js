var debugging = false;

var REFRESH_ALARM_NAME = "refresh";
var REFRESH_DELAY = 3000;
var delayedRefreshFunctions = Array();
var dealsTabID = chrome.tabs.TAB_ID_NONE;
var dealsTabURL = "https://opskins.com/index.php?loc=shop_search&search_item=*factory*+*new*&min=1&max=&StatTrak=1&inline=&grade=&inline=&type=k&inline=&sort=n";
var SEARCH_PAGE_STRING = "loc=shop_search",
    DEALS_PAGE_STRING = "*factory*+*new*&min=1",
    ICON_URL = "assets/icon128.png";

function debugLog(message) {
  if (debugging) {
    console.log(message);
  }
}

function messageReceived() {
  debugLog("Message Received");
}

function defaultNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: ICON_URL,
    title: title,
    message: message
  });
}

chrome.runtime.onMessage.addListener(function(message, sender, messageReceived) {
  if (message.opPointsTotal) {
    chrome.storage.sync.get({
      opPointsTotal: 0
    }, function(items) {
      if (message.opPointsTotal != items.opPointsTotal) {
        chrome.storage.sync.set({
          opPointsTotal: message.opPointsTotal
        }, function() {
          defaultNotification("OP Points Updated!", "You have " + message.opPointsTotal + " OP points.");
          if (dealsTabID) {
            chrome.tabs.sendMessage(dealsTabID, {
              command: "updateOPPoints",
              opPoints: message.opPointsTotal
            });
          }
        });
      }
    });
  }
  if (message.command == "startRefresh") {

    chrome.tabs.query({}, function(tabs) {
      var noSearchPages = true;
      debugLog(tabs);
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        debugLog(tab.url);
        if (tab.url && isSearchPage(tab.url) && !isDealsPage(tab.url)) {
          noSearchPages = false;
          break;
        }
      }
      if (noSearchPages) {
        alert("No search pages to refresh");
      } else {
        var messageString, titleString;
        chrome.storage.sync.get({
          refreshRate: 3
        }, function(items) {
          chrome.alarms.get(REFRESH_ALARM_NAME, function(alarm) {
            if (alarm) {
              // loadSettings(createAlarm);
              for (var i = 0; i < delayedRefreshFunctions.length; i++) {
                clearTimeout(delayedRefreshFunctions[i]);
              }
              titleString = "Auto-Refresh Restarting!";
              messageString = "Auto-Refresh has been restarted. All open search tabs will automatically refresh every " + items.refreshRate + " minutes.";
              // alert("Auto-Refresh Restarting");
            } else {
              titleString = "Auto-Refresh Starting!";
              messageString = "All open search tabs will automatically refresh every " + items.refreshRate + " minutes.";
              // alert("Auto-Refresh Starting");
            }
            defaultNotification(titleString, messageString);
            loadSettings(createAlarm);
          });
        });
      }
    });
  } else if (message.command == "stopRefresh") {
    // alert("Auto-Refresh Stopped");
    defaultNotification("Auto-Refresh Stopped", "Open search tabs will no longer automatically refresh");
    debugLog("Alarm Stopped");
    debugLog(delayedRefreshFunctions);
    chrome.storage.sync.set({
      timerGoing: false
    });
    stopRefresh();
    // for (var i = 0; i < delayedRefreshFunctions.length; i++) {
    //   clearTimeout(delayedRefreshFunctions[i]);
    // }
    // chrome.alarms.clear(REFRESH_ALARM_NAME);
  } else if (message.command == "alreadyStopped") {
    // alert("Auto-Refresh Already Stopped");
    defaultNotification("Auto-Refresh Already Stopped!", "Auto-Refresh is not currenty active.");
  } else if (message.command == "openDealsPage") {
    chrome.tabs.create({
      url: dealsTabURL
    }, function(tab) {
      // dealsTabID = tab.id;
      chrome.storage.sync.set({
        dealsTabID: tab.id
      }, function() {
        stopRefresh();
      });
    });
    // } else if (message.command == "refreshDealsPage") {
    //   dealsTabID = sender.tab.id;
  } else if (message.command == "addItemsToDealsPage" || message.command == "otherPageLoaded") {
    // debugLog("Tab has requested to add items");
    // debugLog(message.deals);
    message.tabID = sender.tab.id;
    chrome.storage.sync.get({
      dealsTabID: null
    }, function(items) {
      if (items.dealsTabID) {
        chrome.tabs.sendMessage(items.dealsTabID, message);
      } else {
        debugLog("deals tab not found");
      }
    });
  }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  debugLog("tab removed! tabID: " + tabId);
  chrome.storage.sync.get({
    dealsTabID: null
  }, function(items) {
    if (tabId == items.dealsTabID) {
      items.dealsTabID = null;
    }
    if (items.dealsTabID) {
      chrome.tabs.sendMessage(items.dealsTabID, {
        command: "tabClosed",
        tabID: tabId
      });
    }
  });
  chrome.tabs.query({}, function(tabs) {
    var noSearchPages = true;
    debugLog(tabs);
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      debugLog(tab.url);
      if (tab.url && isSearchPage(tab.url) && !isDealsPage(tab.url)) {
        noSearchPages = false;
        break;
      }
    }
    if (noSearchPages) {
      chrome.alarms.get(REFRESH_ALARM_NAME, function(alarm) {
        if (alarm) {
          // alert("No remaining search pages, Auto-Refresh stopped!");
          console.log("No remaining search pages, Auto-Refresh stopped!");
          stopRefresh();
        }
      });
    }
  });
});

function stopRefresh() {
  for (var i = 0; i < delayedRefreshFunctions.length; i++) {
    clearTimeout(delayedRefreshFunctions[i]);
  }
  chrome.storage.sync.set({
    timerGoing: false,
    timerStart: Date.now()
  });
  chrome.alarms.clear(REFRESH_ALARM_NAME);
}

function loadSettings(callback) {
  chrome.storage.sync.get({
      autoRefresh: false,
      refreshRate: 5,
      refreshDelay: 3
    },
    function(items) {
      var settings = {
        "autoRefresh": items.autoRefresh,
        "refreshRate": items.refreshRate,
        "refreshDelay": items.refreshDelay
      };
      callback(settings);
    });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  loadSettings(function(settings) {
    debugLog("Refreshing!");
    chrome.tabs.query({}, function(tabs) {
      var tabCount = 0;
      delayedRefreshFunctions = Array();
      chrome.storage.sync.set({
        timerGoing: true,
        timerStart: Date.now()
      });
      for (var i = 0; i < tabs.length; i++) {
        var url = tabs[i].url;
        if ((url.indexOf("opskins") >= 0) && isSearchPage(url) && !isDealsPage(url)) {
          if (tabCount == 0) {
            refreshTab(tabs[i].id);
          } else {
            // debugLog(settings["refreshDelay"]);
            // setTimeout(refreshTab(tabs[i].id), 3000);
            delayedRefreshFunctions.push(setTimeout(refreshTab, (parseFloat(settings["refreshDelay"]) * tabCount * 1000), tabs[i].id));
          }
          tabCount++;
          // chrome.tabs.reload(tabs[i].id);
        }
      }
    });
  });
});

function isSearchPage(url) {
  return url.indexOf(SEARCH_PAGE_STRING) >= 0;
}

function isDealsPage(url) {
  return url.indexOf(DEALS_PAGE_STRING) >= 0;
}

function createAlarm(settings) {
  // if (settings["autoRefresh"]) {
  var period = parseFloat(settings["refreshRate"]);
  // var period = .2;
  chrome.alarms.create(
    REFRESH_ALARM_NAME, {
      // delayInMinutes: settings.refreshRate,
      // delayInMinutes: .2
      // periodInMinutes: settings.refreshRate
      when: Date.now(),
      periodInMinutes: period
    }
  );
  chrome.storage.sync.set({
    timerGoing: true,
    timerStart: Date.now()
  });
  debugLog("Alarm created! Pages will refresh on a " + period.toFixed(2) + " minute interval");
  // }
}

function refreshTab(tabID) {
  chrome.tabs.reload(tabID);
}