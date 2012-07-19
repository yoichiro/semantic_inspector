var Popup = function() {
    this.initialize();
};

Popup.prototype = {
    initialize: function() {
        this.bg = chrome.extension.getBackgroundPage();
    },
    start: function() {
        this.bg.sv.getSelectedTabItems(function(info, title, url) {
            this.onReceiveItems(info.items, title, url);
        }.bind(this));
    },
    onReceiveItems: function(items, title, url) {
        this.showPageInfo(title, url);
        this.renderItems(items, $("items"));
    },
    showPageInfo: function(title, url) {
        var link = this.createElement("a", $("header"));
        link.href = url;
        link.appendChild(document.createTextNode(title));
    },
    renderItems: function(items, parent) {
        for (var i = 0; i < items.length; i++) {
            this.renderItem(items[i], parent, false);
        }
    },
    renderItem: function(item, parent, shift) {
        var itemDiv = this.createElement("div", parent);
        itemDiv.addClassName("item");
        if (shift) {
            itemDiv.addClassName("item_shift");
        }

        var itemMetaDiv = this.createElement("div", itemDiv);
        itemMetaDiv.addClassName("item_meta");

        var itemImg = this.createElement("img", itemMetaDiv);
        itemImg.src = "./item16.png";

        var itemTypeDiv = this.createElement("div", itemMetaDiv);
        itemTypeDiv.addClassName("item_type");
        if (item.type) {
            itemTypeDiv.appendChild(document.createTextNode(item.type));
        } else {
            itemTypeDiv.appendChild(document.createTextNode("Type not specified"));
            itemTypeDiv.addClassName("item_type_unknown");
        }

        if (item.id) {
            this.appendBrNode(itemMetaDiv);
            var itemIdDiv = this.createElement("div", itemMetaDiv);
            itemIdDiv.addClassName("item_id");
            itemIdDiv.appendChild(document.createTextNode(item.id));
        }

        this.appendBrNode(itemMetaDiv);

        var propertiesDiv = this.createElement("div", itemDiv);
        propertiesDiv.addClassName("properties");

        for (var propertyName in item.properties) {
            var propertyValues = item.properties[propertyName];

            for (var i = 0; i < propertyValues.length; i++) {
                var propertyValue = propertyValues[i];

                var propertyDiv = this.createElement("div", propertiesDiv);
                propertyDiv.addClassName("property");

                var propertyImg = this.createElement("img", propertyDiv);
                propertyImg.src = "./property16.png";

                var propertyNameDiv = this.createElement("div", propertyDiv);
                propertyNameDiv.addClassName("property_name");
                propertyNameDiv.appendChild(document.createTextNode(propertyName));

                this.appendBrNode(propertyDiv);

                if (Object.isString(propertyValue)) {
                    var propertyValueDiv = this.createElement("div", propertyDiv);
                    propertyValueDiv.addClassName("property_value");

                    if (this.isUrlString(propertyValue)) {
                        var propertyValueA = this.createElement("a", propertyValueDiv);
                        propertyValueA.href = propertyValue;
                        propertyValueA.target = "_blank";
                        var propertyValueText = document.createTextNode(propertyValue);
                        propertyValueA.appendChild(propertyValueText);

                        if (this.isImageUrlString(propertyValue)) {
                            var propertyValueImg = this.createElement("img", propertyValueDiv);
                            propertyValueImg.src = propertyValue;
                            propertyValueImg.width = 200;

                            this.appendBrNode(propertyDiv);
                        }
                    } else {
                        var propertyValueText = document.createTextNode(propertyValue);
                        propertyValueDiv.appendChild(propertyValueText);
                    }
                } else {
                    this.renderItem(propertyValue, propertyDiv, true);
                }
            }
        }
    },
    createElement: function(name, parent) {
        var element = document.createElement(name);
        parent.appendChild(element);
        return element;
    },
    isUrlString: function(target) {
        return target.startsWith("http://") || target.startsWith("https://");
    },
    isImageUrlString: function(target) {
        var url = target.toLowerCase();
        return url.endsWith("png")
            || url.endsWith("jpg")
            || url.endsWith("jpeg")
            || url.endsWith("gif");
    },
    appendBrNode: function(parent) {
        var br = document.createElement("br");
        br.setStyle({
            clear: "both"
        });
        parent.appendChild(br);
    }
};

var popup = new Popup();
window.onload = function() {
    popup.start();
};