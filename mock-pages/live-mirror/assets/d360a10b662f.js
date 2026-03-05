
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills-legacy.Bg7Zr0hX.js","/cdn/shopifycloud/checkout-web/assets/c1/app-legacy.Zfo2VSAl.js","/cdn/shopifycloud/checkout-web/assets/c1/vendor-legacy.dJXQKwx3.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-ja-legacy.eJbc-8Ve.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage-legacy.Bw_xj_9u.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayOptInDisclaimer-legacy.k0zr550k.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeDescriptionText-legacy.DuojhLjR.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalPickup-legacy.ZOw3GIX8.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo-legacy.Dskpg1nS.js","/cdn/shopifycloud/checkout-web/assets/c1/VaultedPayment-legacy.DXDc_jTH.js","/cdn/shopifycloud/checkout-web/assets/c1/PickupPointCarrierLogo-legacy.BHaEQdSS.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-legacy.DJal33fb.js","/cdn/shopifycloud/checkout-web/assets/c1/AddDiscountButton-legacy.Cl8EMLij.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary-legacy.P0ks7GuE.js","/cdn/shopifycloud/checkout-web/assets/c1/OrderEditVaultedDelivery-legacy.Cz4N1-wh.js","/cdn/shopifycloud/checkout-web/assets/c1/SeparatePaymentsNotice-legacy.3mws73EI.js","/cdn/shopifycloud/checkout-web/assets/c1/OffsitePaymentFailed-legacy.Bp8pY8G8.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblemsLineItemList-legacy.CW3JVQ6d.js","/cdn/shopifycloud/checkout-web/assets/c1/flags-legacy.BmJdCgn7.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions-legacy.DQqcSGBi.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown-legacy.BvB2P4FW.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal-legacy.Cw6hcYnU.js"];
      var styles = [];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0586/6147/0295/files/logo_w235_x320.jpg?v=1712311408"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  