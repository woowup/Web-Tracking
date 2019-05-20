(function () {

    const LAST_SESSION_KEY = '_wulastsession';
    const WU_TRACK_URL = "https://peax4bu9ml.execute-api.us-east-1.amazonaws.com/prod/web-tracking/track";
    const SESSION_DURATION = 3600;

    function _track (publicKey, eventName, metadata, callback) {

        WU.config = Object.assign({}, _default, WU.config);
        WU._publicKey = publicKey || WU._publicKey;
        WU._metadata = metadata || WU._metadata;

        let wuid = _getId();

        if (!wuid) {
            return;
        }

        let event = {
            publicKey: publicKey,
            wuid: wuid,
            event: eventName,
            sessionId: _getLastSession(),
            userAgent: window.navigator.userAgent,
            origin: window.location.href,
            referrer: document.referrer,
            utms: {
                source: getParameterByName('utm_source'),
                medium: getParameterByName('utm_medium'),
                campaign: getParameterByName('utm_campaign'),
                term: getParameterByName('utm_term')
            },
            metadata: metadata || {}
        };

        _post(WU_TRACK_URL, event, callback);
    }

    function _getIdTypeName(type)
    {
        return '_' + type;
    }

    function _getId() {
        let parameter = window.WU.config.identifier;
        let id = getParameterByName(parameter);

        if (id) {
            window.localStorage.setItem(_getIdTypeName(parameter), id);
            return id;
        }

        id = window.localStorage.getItem(_getIdTypeName(parameter));

        return id ? id : null;
    }

    function _transformSessionDateToId(date)
    {
        return date.getUTCFullYear() + (date.getUTCMonth() + 1).toString().padStart(2, "0") + (date.getUTCDate()).toString().padStart(2, "0") + (date.getUTCHours()).toString().padStart(2, "0");
    }

    function _getLastSession() {
        let sessionDate = window.localStorage.getItem(LAST_SESSION_KEY);
        let sessionId = sessionDate;
        let now = new Date();

        if (!sessionDate || now.getTime() - new Date(sessionDate).getTime() > (window.WU.config.sessionDuration * 1000)) {
            window.localStorage.setItem(LAST_SESSION_KEY, now.toISOString());
            sessionId = now.toISOString();
        }

        return _transformSessionDateToId(new Date(sessionId));
    }

    function _post(url, body, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', url);

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
                else if (xhr.status >= 400) {
                    console.log('Request failed.  Returned status of ' + xhr.status + '. Text: ' + xhr.responseText);
                }
            }
        };

        xhr.send(JSON.stringify(body));
    }

    function jsonToQueryString(json) {
        return '?' + 
            Object.keys(json).map(function(key) {
                return encodeURIComponent(key) + '=' +
                    encodeURIComponent(json[key]);
            }).join('&');
    }

    function getParameterByName(name, url) {
        if (!name) return null;
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function _isVTEX()
    {
        return 'Vtex' in window;
    }

    function _addVTEXListener(event, listenerName, handler)
    {
        let listener = new Vtex.JSEvents.Listener(listenerName, handler);
        skuEventDispatcher.addListener(event, listener);
    }

    function _getVTEXWoowUpSku()
    {
        try {
            let element = $('.skuReference').get(0)
            return element != undefined ? element.innerHTML : element;
        } catch (err) {
            console.error(err)
            return null;
        }
    }

    function _getVTEXProductBySku(sku)
    {
        for (let i in skuJson.skus) {
            if (skuJson.skus[i].sku == sku) {
                return skuJson.skus[i];
            }
        }

        return null;
    }

    function WoowUpVTEXTrackingSKUChangedHandler(e)
    {
        let product = _getVTEXProductBySku(e.newSkuId);

        if (product.available) {
            _trackProductVTEX(WU._publicKey, WU._metadata)
        } else {
            console.info("The product " + e.newSkuId + " is not available");
        }
    }

    function _trackProductVTEX(publicKey, metadata, callback)
    {
        WU._publicKey = publicKey || WU._publicKey;
        WU._metadata = metadata || WU._metadata;

        let sku = _getVTEXWoowUpSku();

        if (sku && WU._vtexUniqueSkus.indexOf(sku) == -1) {
            WU._metadata.sku = sku;
            WU._vtexUniqueSkus.push(sku);

            _track(WU._publicKey, 'product-view', WU._metadata, callback)
        }
    }

    var WU = {};

    let _default = {
        sessionDuration: SESSION_DURATION,
        identifier: 'wuid'
    }

    WU.config = Object.assign({}, _default);
    WU.track = _track;
    WU.trackProductVTEX = _trackProductVTEX;
    WU._publicKey = null;
    WU._metadata = {};

    window.WU = WU;

    if (_isVTEX()) {
        WU._vtexUniqueSkus = [];
        _addVTEXListener('skuSelectionChanged', 'WoowUpVTEXTrackingSKUChanged', WoowUpVTEXTrackingSKUChangedHandler);
    }

    _getId()
    _getLastSession()
})();