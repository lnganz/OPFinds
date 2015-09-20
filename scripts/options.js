// $(document).ready(function(){
//     $('[data-toggle="tooltip"]').tooltip(); 
// }); 

// Saves options to chrome.storage
function save_options() {
  var ts = document.getElementById('sort').checked;
  var ik = document.getElementById('ignore').checked;
  var rm = document.getElementById('remove').checked;
  var il = document.getElementById('ignoreList').value;
  var limRes = document.getElementById('limitResults').checked;
  var numRes = document.getElementById('numResults').value;
  // var dealCut = document.getElementById('dealCutoff').value;
  // var search = document.getElementById('linkSearch').checked;
  var c1 = document.getElementById('color1').value;
  var c2 = document.getElementById('color2').value;
  var c3 = document.getElementById('color3').value;
  var c4 = document.getElementById('color4').value;
  var cr1 = document.getElementById('colorRange1').value;
  var cr2 = document.getElementById('colorRange2').value;
  var cr3 = document.getElementById('colorRange3').value;
  // var ar = document.getElementById('autoRefresh').checked;
  var rr = document.getElementById('refreshRate').value;
  var utt = document.getElementById('updateTabTitle').checked;
  var gp = document.getElementById('goodPercentage').value;
  var rd = document.getElementById('refreshDelay').value;
  var se = document.getElementById('soundEnabled').checked;
  // var sf = document.getElementById('soundFile').value;
  // var sf = document.getElementById('soundFile').files[0].fileName;
  chrome.storage.sync.set({
    toggleSorted: ts,
    ignoreKeywords: ik,
    ignoreList: il,
    removeDuds: rm,
    limitResults: limRes,
    numResults: numRes,
    // dealCutoff: dealCut,
    // linkSearch: search,
    color1: c1,
    color2: c2,
    color3: c3,
    color4: c4,
    colorRange1: cr1,
    colorRange2: cr2,
    colorRange3: cr3,
    // autoRefresh: ar,
    refreshRate: rr,
    updateTabTitle: utt,
    goodPercentage: gp,
    refreshDelay: rd,
    soundEnabled: se,
    // soundFile: sf,
    // selectedFile: sf
  }, function() {
    // Update status to let user know options were saved.
    // document.getElementById('selectedFile').textContent = sf;
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value toggleSorted = true and ignoreDragonKing = true.
  chrome.storage.sync.get({
    toggleSorted: true,
    ignoreKeywords: false,
    ignoreList: "Dragon King, Sunset Storm",
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
    // autoRefresh: false,
    refreshRate: 3,
    updateTabTitle: true,
    goodPercentage: 35,
    refreshDelay: 3,
    soundEnabled: true,
    // soundFile: null,
    // selectedFile: "No File"
  }, function(items) {
    document.getElementById('sort').checked = items.toggleSorted;
    document.getElementById('ignore').checked = items.ignoreKeywords;
    document.getElementById('remove').checked = items.removeDuds;
    document.getElementById('ignoreList').value = items.ignoreList;
    document.getElementById('limitResults').checked = items.limitResults;
    document.getElementById('numResults').value = items.numResults;
    // document.getElementById('dealCutoff').value = items.dealCutoff;
    // document.getElementById('linkSearch').checked = items.linkSearch;
    document.getElementById('color1').value = items.color1;
    document.getElementById('color2').value = items.color2;
    document.getElementById('color3').value = items.color3;
    document.getElementById('color4').value = items.color4;
    document.getElementById('colorRange1').value = items.colorRange1;
    document.getElementById('colorRange2').value = items.colorRange2;
    document.getElementById('colorRange3').value = items.colorRange3;
    // document.getElementById('autoRefresh').checked = items.autoRefresh;
    document.getElementById('refreshRate').value = items.refreshRate;
    document.getElementById('updateTabTitle').checked = items.updateTabTitle;
    document.getElementById('goodPercentage').value = items.goodPercentage;
    document.getElementById('refreshDelay').value = items.refreshDelay;
    document.getElementById('soundEnabled').checked = items.soundEnabled;
    // document.getElementById('selectedFile').textContent = items.selectedFile
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);