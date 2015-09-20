var DEALS_PAGE_URL = "https://opskins.com/index.php?loc=shop_search&search_item=*factory*+*new*&min=1&max=&StatTrak=1&inline=&grade=&inline=&type=k&inline=&sort=n";
var SEARCH_PAGE_STRING = "loc=shop_search";
var debugging = false;

var itemCollection = $("div.featured-item");
var goodItems = new Array(),
    goodItemsObjectArray = new Array(),
    goodItemsArray = new Array(),
    goodItemsArrayWithPercentages = new Array();
var itemBoxParent;
var xIconURL = chrome.extension.getURL('assets/icon_x.png');

function debugLog(message) {
    if (debugging) {
        console.log(message);
    }
}

function loadSettings(callback) {
    chrome.storage.sync.get({ // Load settings
        toggleSorted: true,
        ignoreList: "Dragon King, Sunset Storm",
        ignoreKeywords: true,
        removeDuds: true,
        limitResults: true,
        numResults: 100,
        // dealCutoff: 30,
        // linkSearch: true,
        color1: "000000",
        color2: "#FFFF00",
        color3: "#FFA500",
        color4: "#FF0000",
        colorRange1: 20,
        colorRange2: 30,
        colorRange3: 40,
        updateTabTitle: true,
        goodPercentage: 35,
        opPointsTotal: 0
    }, function(items) {
        var settings = {
            "toggleSorted": items.toggleSorted,
            "ignoreList": items.ignoreList,
            "ignoreKeywords": items.ignoreKeywords,
            "removeDuds": items.removeDuds,
            "limitResults": items.limitResults,
            "numResults": items.numResults,
            // "dealCutoff": items.dealCutoff,
            // "linkSearch": items.linkSearch,
            "color1": items.color1,
            "color2": items.color2,
            "color3": items.color3,
            "color4": items.color4,
            "colorRange1": items.colorRange1,
            "colorRange2": items.colorRange2,
            "colorRange3": items.colorRange3,
            "updateTabTitle": items.updateTabTitle,
            "goodPercentage": items.goodPercentage,
            "opPointsTotal": items.opPointsTotal
        };
        callback(settings);
    });
}

function update(settings) {
    var goodDealPercentage = 1 - (parseFloat(settings["goodPercentage"]) / 100);
    var goodDealCount = 0;
    var colorCutoff1 = 1 - parseFloat(settings["colorRange1"]) / 100;
    var colorCutoff2 = 1 - parseFloat(settings["colorRange2"]) / 100;
    var colorCutoff3 = 1 - parseFloat(settings["colorRange3"]) / 100;
    var keywords = settings["ignoreList"].split(","); // Create array of keywords to ignore

    for (var i = 0; i < keywords.length; i++) {
        keywords[i] = keywords[i].trim(); // Remove excess whitespace from keywords
    }
    // debugLog(keywords);
    // debugLog(settings["limitResults"]);
    // debugLog(settings["numResults"]);
    if (settings["limitResults"]) { // If results should be limited
        var end = Math.min(settings["numResults"], itemCollection.length); // Determine final index of item array
        for (var j = end; j < itemCollection.length; j++) {
            itemCollection[j].parentNode.parentNode.removeChild(itemCollection[j].parentNode); // Remove remaining items from page
        }
        itemCollection = itemCollection.slice(0, end); // Truncate item array
    }
    // debugLog(itemCollection.length);
    for (var i = 0; i < itemCollection.length; i++) {
        var curItem = itemCollection[i];
        var newItem = new Object();

        var testID = "id not found";

        var opPrice = curItem.getElementsByClassName("item-amount")[0].textContent; // Price on opskins
        var steamPrice = curItem.getElementsByClassName("market-name");
        var steamName = "";
        for (var j = 0; j < steamPrice.length; j++) { // Check each element of steam price element
            var txt = steamPrice[j].textContent;
            if (txt) {
                if (txt.indexOf("Suggested") >= 0) { // If textcontent contains the suggested price
                    steamPrice = txt.split(" ")[2]; // Extract steam price from text
                } else {
                    steamName = txt; // Otherwise txt is the item name
                    testID = steamPrice[j].href.match(/(item=(\d)*)/i)[0];
                }
            }
        }
        debugLog(testID);
        newItem.itemID = testID;

        // Remove number separaters from price strings
        opPrice = parseFloat(opPrice.replace(/[^\d\.\-\ ]/g, ''));
        steamPrice = parseFloat(steamPrice.replace(/[^\d\.\-\ ]/g, ''));
        var percent = opPrice / steamPrice;

        newItem.opPrice = opPrice;
        newItem.steamPrice = steamPrice;
        newItem.percent = percent;
        itemBoxParent = curItem.parentNode.parentNode; // Finds the containing element of the item

        // if (settings["removeDuds"] && percent > 1 - (parseFloat(settings["dealCutoff"]) / 100)) { // If deal should be removed
        if (settings["removeDuds"] && percent > goodDealPercentage) { // If deal should be removed
            itemBoxParent.removeChild(curItem.parentNode); // Remove item from page
        } else {
            var removed = false;
            if (settings["ignoreKeywords"]) {
                for (var k = 0; k < keywords.length; k++) { // Check each item for ignored keywords
                    // debugLog(keywords[k]);
                    var word = keywords[k];
                    if (word && (word.trim() != "") && curItem.getElementsByTagName("a")[0].textContent.indexOf(word) >= 0) {
                        itemBoxParent.removeChild(curItem.parentNode); // Remove item from page
                        removed = true;
                        break;
                    }
                }
            }
            if (!removed) { // If item hasn't been removed
                if (percent <= goodDealPercentage) {
                    goodDealCount++;
                    goodItemsObjectArray.push(newItem);
                }
                var div = document.createElement("div");
                div.style.borderBottom = "1px solid white";
                div.style.textAlign = "center";
                var link = "";
                // if (settings["linkSearch"]) { // If search link needs to be created
                // 
                // Disabled 8/29 when opskins added search button
                // if (true) { // Temporarily always true
                //     var stattrak = 0;
                //     if (steamName.indexOf("StatTrak") >= 0) // Check if StatTrak
                //         stattrak = 1;
                //     steamName = steamName.replace(/\s/g, "+"); // Replace spaces with +'s
                //     // debugLog(steamName);
                //     // newItem.itemID = opPrice + steamName;
                //     link = 'href="https://opskins.com/index.php?loc=shop_search&search_item=' + steamName + "&min=&max=&StatTrak=" + stattrak + '&inline=&grade=&inline=&type=&inline=&sort=lh"';
                //     // link = 'https://opskins.com/index.php?loc=shop_search&search_item=' + steamName 
                //     // + "&min=&max=&StatTrak=" + stattrak + '&inline=&grade=&inline=&type=&inline=&sort=n';
                //     newItem.searchLink = link;
                // }
                
                if (percent > 1) { // If the OP price is higher than suggested price
                    div.innerHTML = '<a class="market-name market-link" ' +
                        link + ' style="float: center;"> ' + (100 * (percent - 1)).toFixed(0) +
                        '% higher!!</span>';
                } else { // OP price is lower than suggested price
                    div.innerHTML = '<a class="market-name market-link" ' +
                        link + ' style="float: center;"> ' + (100 * (1 - percent)).toFixed(0) +
                        '% lower!!</span>';
                }

                curItem.insertBefore(div, curItem.firstChild);
                curItem.style.borderWidth = "5px";
                if (percent > colorCutoff1) {
                    curItem.style.borderColor = settings["color1"];
                } else if (percent > colorCutoff2) {
                    curItem.style.borderColor = settings["color2"];
                } else if (percent > colorCutoff3) {
                    curItem.style.borderColor = settings["color3"];
                } else {
                    curItem.style.borderColor = settings["color4"];
                }
                newItem.html = curItem.parentNode.outerHTML;
                goodItems.push([percent, curItem.parentNode]);
                // goodItemsArray.push(curItem.parentNode.outerHTML);
                goodItemsArrayWithPercentages.push([percent, curItem.parentNode.outerHTML]);
                if (settings["toggleSorted"]) {
                    itemBoxParent.removeChild(curItem.parentNode);
                }
            }
        }
    }

    function Comparator(a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
    }

    if (settings["toggleSorted"]) {
        goodItems.sort(Comparator);
        for (var i = 0; i < goodItems.length; i++) {
            itemBoxParent.appendChild(goodItems[i][1]);
        }
    }

    if (settings["updateTabTitle"]) {
        document.title = goodDealCount + " potential deal(s)!";
        debugLog(goodItemsObjectArray);
    }

    var curOPPoints = document.getElementById('op-count');
    if (curOPPoints) {
        curOPPoints = curOPPoints.textContent;
        curOPPoints = parseFloat(curOPPoints.replace(/[^\d\.\-\ ]/g, ''));
    }

    chrome.runtime.sendMessage({
        command: "addItemsToDealsPage",
        // deals: goodItemsArray,
        items: goodItemsObjectArray,
            // deals: goodItemsArrayWithPercentages,
        opPointsTotal: curOPPoints
    });
    // debugLog(goodItemsArray);
}

if (document.URL != DEALS_PAGE_URL && document.URL.indexOf(SEARCH_PAGE_STRING) >= 0) {
    loadSettings(update);
} else {
    chrome.runtime.sendMessage({
        command: "otherPageLoaded"
    });
}

// function item()