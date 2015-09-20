var timerReload = null;
var OPTIONS_URL = "html/options.html";
document.getElementById('options').addEventListener('click', function() {
  openOrFocusOptionsPage();
});

document.getElementById('openDealsPage').addEventListener('click', function() {
  chrome.runtime.sendMessage({
    command: "openDealsPage"
  });
});

document.getElementById('startRefresh').addEventListener('click', function() {
  // chrome.tabs.sendMessage({startRefresh: true});
  chrome.runtime.sendMessage({
    command: "startRefresh"
  });
  setTimeout(reloadTimer, 500);
});

document.getElementById('stopRefresh').addEventListener('click', function() {
  // chrome.alarms.clear("refresh"); // Cancel automatic refreshing of tabs
  chrome.alarms.clear("refresh", function(wasCleared) {
    if (wasCleared) {
      console.log("Alarm STOPPED")
        // alert("Auto-refresh stopped");
      chrome.runtime.sendMessage({
        command: "stopRefresh"
      });
    } else {
      console.log("Alarm ALREADY OFF");
      // alert("Auto-refresh already off");
      chrome.runtime.sendMessage({
        command: "alreadyStopped"
      });
    }
  });
  setTimeout(reloadTimer, 500);
});

function openOrFocusOptionsPage() {
  var optionsUrl = chrome.extension.getURL(OPTIONS_URL);
  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i = 0; i < extensionTabs.length; i++) {
      if (optionsUrl == extensionTabs[i].url) {
        found = true;
        console.log("tab id: " + extensionTabs[i].id);
        chrome.tabs.update(extensionTabs[i].id, {
          "selected": true
        });
      }
    }
    if (found == false) {
      chrome.tabs.create({
        url: OPTIONS_URL
      });
    }
  });
}

chrome.extension.onConnect.addListener(function(port) {
  var tab = port.sender.tab;
  // This will get called by the content script we execute in
  // the tab as a result of the user pressing the browser action.
  port.onMessage.addListener(function(info) {
    var max_length = 1024;
    if (info.selection.length > max_length)
      info.selection = info.selection.substring(0, max_length);
    openOrFocusOptionsPage();
  });
});



function save_options() {
  var rd = document.getElementById('removeDuds').checked;
  chrome.storage.sync.set({
    removeDuds: rd
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function loadTime() {
  // Use default value toggleSorted = true and ignoreDragonKing = true.
  chrome.storage.sync.get({
    timerStart: Date.now(),
    refreshRate: 3,
    timerGoing: false
  }, function(items) {
    var timer = document.getElementById('timer');
    timer.innerHTML = "Loading...";
    // clearInterval(timerReload);
    if (items.timerGoing) {
      // timerReload = setInterval(function() {
      var d1 = Date.now();
      var d2 = items.timerStart;
      var time = (d1 - d2) / 1000;
      time = items.refreshRate * 60 - time;
      if (time < 0) time += items.refreshRate * 60;
      var h = 0;
      var m = Math.floor(time / 60);
      var s = Math.floor(time % 60);
      if (m > 59) {
        h = m / 60;
        m = m % 60;
      }
      if (m < 0) m = 0;
      if (s < 0) s = 0;
      if (s < 10) {
        s = "0" + s;
      }
      if (h > 0) {
        timer.innerHTML = h + ":" + m + ":" + s;
      } else {
        timer.innerHTML = m + ":" + s;
      }

      // }, 1000);
    } else {
      timer.innerHTML = "No Timer";
    }
  });
}

function reloadTimer() {
  clearInterval(timerReload);
  timerReload = setInterval(loadTime, 1000);
}

function loadSettings() {
  chrome.storage.sync.get({
    removeDuds: true
  }, function(items) {
    document.getElementById('removeDuds').checked = items.removeDuds;
  });
}
loadSettings();
reloadTimer();

document.addEventListener('DOMContentLoaded', loadTime);
document.getElementById('save').addEventListener('click',
  save_options);