var debugging = false;

var xIconURL = chrome.extension.getURL('assets/icon_x.png'),
    soundclipURL = chrome.extension.getURL('assets/deal.mp3');
var DEALS_PAGE_URL = "https://opskins.com/index.php?loc=shop_search&search_item=*factory*+*new*&min=1&max=&StatTrak=1&inline=&grade=&inline=&type=k&inline=&sort=n";
var isDealsPage = (document.URL == DEALS_PAGE_URL);
var itemBoxParent = null,
    items = null,
    itemsToStore = new Array(),
    tabToItemsMap = {},
    idToItemMap = {},
    allItemsToSort = new Array(),
    tabList = new Array(),
    ignoredItemIDs = {},
    shownItemIDs = {};

function debugLog(message) {
    if (debugging) {
        console.log(message);
    }
}

if (isDealsPage) {
    document.title = "ALL DEALS";
    items = $("div.featured-item");
    itemBoxParent = items[0].parentNode.parentNode;
    for (var i = 0; i < items.length; i++) {
        items[i].parentNode.parentNode.removeChild(items[i].parentNode);
    }
}

chrome.runtime.onMessage.addListener(function(message, sender, messageSent) {
    debugLog("message recieved from tabid: " + message.tabID);
    if (message.command == "updateOPPoints") {
        var pointsDiv = document.getElementById('op-count');
        if (pointsDiv) {
            var points = message.opPointsTotal;
            pointsDiv.textContent = points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    }
    if (message.command == "tabClosed" || message.command == "otherPageLoaded") {
        debugLog(message.command);
        if (isDealsPage) {
            var idx = tabList.indexOf(message.tabID)
            if (idx >= 0) {
                debugLog("tabList index: " + idx);
                tabList.splice(idx, 1);
            }
            debugLog(tabToItemsMap);
            if (tabToItemsMap[message.tabID]) {
                for (var i = 0; i < tabToItemsMap[message.tabID].length; i++) {
                    var item = tabToItemsMap[message.tabID][i];
                    if (!ignoredItemIDs[item.itemID]) {
                        debugLog("removing: " + item.div);
                        removeItem(item.itemID);
                    }
                }
                tabToItemsMap[message.tabID] = new Array();
            }
        }
    } else if (message.command == "addItemsToDealsPage") {
        if (isDealsPage) {
            var oldItemsArray = tabToItemsMap[message.tabID];
            debugLog("old items: " + oldItemsArray);
            debugLog("adding items, tabID: " + message.tabID);
            if (tabList.indexOf(message.tabID) < 0) {
                tabList.push(message.tabID);
            }
            if (oldItemsArray && oldItemsArray.length > 0) {
                for (var i = 0; i < oldItemsArray.length; i++) {
                    var item = oldItemsArray[i];
                    removeItem(item.itemID);
                }
            }

            itemsToStore = new Array();
            var gotNewItem = false;
            for (var i = 0; i < message.items.length; i++) {
                var item = message.items[i];
                if (!ignoredItemIDs[item.itemID] && !shownItemIDs[item.itemID]) { // Check if item has been ignored or already shown
                    item.div = document.createElement("div");
                    item.div.parentNode = itemBoxParent;
                    item.div.innerHTML = item.html;
                    item.div.innerHTML = item.div.innerHTML.replace("col-md-4", "col-md-2");
                    var newImg = document.createElement("img");
                    newImg.setAttribute("align", "right");
                    newImg.src = xIconURL;
                    newImg.id = item.itemID;
                    newImg.addEventListener("click", function() {
                        ignoreItem(this.id);
                    });
                    item.div.firstChild.firstChild.firstChild.appendChild(newImg);
                    itemsToStore.push(item);
                    if (!(item.itemID in idToItemMap)) {
                        gotNewItem = true;
                    }
                    idToItemMap[item.itemID] = item;
                    debugLog(idToItemMap);
                }
            }
            debugLog("items to store: " + itemsToStore);
            tabToItemsMap[message.tabID] = itemsToStore;
            debugLog(tabToItemsMap);

            allItemsToSort = new Array();

            for (var i = 0; i < tabList.length; i++) {
                var items = tabToItemsMap[tabList[i]];
                if (items && items.length > 0) {
                    for (var j = 0; j < items.length; j++) {
                        allItemsToSort.push(items[j]);
                    }
                }
            }
            // debugLog(allItemsToSort);
            allItemsToSort.sort(percentComparator);
            for (var i = 0; i < allItemsToSort.length; i++) {
                itemBoxParent.appendChild(allItemsToSort[i].div);
                shownItemIDs[allItemsToSort[i].itemID] = true;
            }

            checkIfSoundEnabled(function(soundOn) {
                if (soundOn && gotNewItem) {
                    playSound();
                }
            });
        }
    }
});

function ignoreItem(id) {
    ignoredItemIDs[id] = true;
    removeItem(id);
}

function removeItem(id) {
    var item = idToItemMap[id];
    shownItemIDs[id] = false;
    if (item && item.div) {
        if (item.div.parentNode)
            item.div.parentNode.removeChild(item.div);
        item.div.remove();
        item.div.style.display = 'none';
        debugLog("trying to remove: " + id);
    }
}

function checkIfSoundEnabled(callback) {
    chrome.storage.sync.get({
        soundEnabled: false
    }, function(items) {
        callback(items.soundEnabled);
    });
}

function playSound() {
    var myAudio = new Audio();
    myAudio.src = soundclipURL;
    myAudio.play();
}

function percentComparator(a, b) {
    if (a.percent < b.percent) return -1;
    if (a.percent > b.percent) return 1;
    return 0;
}