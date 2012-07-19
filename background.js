var SV = function() {
    this.initialize();
};

SV.prototype = {
    initialize: function() {
        this.tabs = {};
        this.setupEventHandler();
    },
    setupEventHandler: function() {
        chrome.tabs.onSelectionChanged.addListener(function(id, info) {
            this.onSelectionChanged(id);
        }.bind(this));
        chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
            this.onSelectionChanged(id);
        }.bind(this));
        chrome.extension.onRequest.addListener(
            function(message, sender, sendRequest) {
                this.onRequest(message, sender.tab, sendRequest);
            }.bind(this)
        );
    },
    onSelectionChanged: function(tabId) {
        chrome.tabs.executeScript(tabId, {
            file: "content_script.js"
        });
    },
    onRequest: function(message, tab, sendRequest) {
        var items = message.items;
        if (items.length > 0) {
            this.tabs[tab.id] = {items: items};
            chrome.pageAction.show(tab.id);
        } else {
            delete this.tabs[tab.id];
            chrome.pageAction.hide(tab.id);
        }
        sendRequest({});
    },
    getSelectedTabItems: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            callback(this.tabs[tab.id], tab.title, tab.url);
        }.bind(this));
    }
};

var sv = new SV();