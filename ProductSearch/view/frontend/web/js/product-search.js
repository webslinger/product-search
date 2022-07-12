/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
  'uiComponent',
  'underscore',
  'ko',
  'jquery',
  'mage/mage'
], function (Component, _, ko, $) {
  'use strict';

  var self;

  return Component.extend({

    /** @inheritdoc */
    initialize: function () {
      this._super();
      this.lowRange = ko.observable(0);
      this.highRange = ko.observable('');
      this.sortingMethods = ko.observableArray(['Ascending','Descending']);
      this.sortingMethod = ko.observable('');
      this.results = ko.observable([]);
      this.errors = ko.observable([]);
      this.maximumRange = 5;
      this.working = ko.observable(false);
      self = this;
    },

    validate: function () {
        this.errors([]);
        var low = parseFloat(this.lowRange());
        var high = parseFloat(this.highRange());
        if (!low && low != 0 || !high) {
            this.errors([{
                message: "Please complete all required fields."
            }]);
            return false;
        }
        if (low > high) {
            this.errors([{ 
                message: "Maximum range must be greater than minimum range." 
            }]);
            return false;
        }
        if (high > this.maximumRange) {
            this.errors([{ 
                message: "Maximum range cannot be greater than 5x the minimum." 
            }]);
            return false;
        }
        return true;
    },

    sort: function () {
        var products = this.results();
        switch (this.sortingMethod()) {
            case "Ascending": 
                products = products.sort(function(a,b) {
                    a.price = parseFloat(a.price);
                    b.price = parseFloat(b.price);
                    if (a.price > b.price) return 1;
                    if (a.price < b.price) return -1;
                    return 0;
                });
                break;
            case "Descending": 
                products = products.sort(function(a,b) {
                    a.price = parseFloat(a.price);
                    b.price = parseFloat(b.price);
                    if (a.price > b.price) return -1;
                    if (a.price < b.price) return 1;
                    return 0;
                });
                break;
        }
        this.results(products);
    },

    updateMaximumRange: function () {
        var low = this.lowRange();
        if (low > 0) {
            this.maximumRange = low * 5;
        } else {
            this.maximumRange = 5;
        }
    },

    search: function () {
        var that = this;
        if (!this.validate()) {
            return;
        }
        this.working(true);
        $.ajax({
            type: 'POST',
            url: '/rest/V1/crimson/productsearch',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                low: this.lowRange(),
                high: this.highRange()
            })
        }).done(function(res) {
            var response = JSON.parse(res);
            if (!response.error) {
                self.results(response);
                self.sort();
            } else {
                self.errors([{ message: response.error }]);
            }
            self.working(false);
        });
    }
  });
});
