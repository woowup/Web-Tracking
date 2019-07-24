(function () {

    const LAST_SESSION_KEY = '_wulastsession';
    const WU_TRACK_URL = "https://tracking.woowup.com/web-tracking/track";
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
        return 'Vtex' in window || 'vtex' in window;
    }

    function _addVTEXListener(event, listenerName, handler)
    {
        let listener = new Vtex.JSEvents.Listener(listenerName, handler);
        skuEventDispatcher.addListener(event, listener);
    }

    function _isSkuAvailableVTEX(sku)
    {
        if (sku && skuJson && 'skus' in skuJson && skuJson.skus.length) {
            return skuJson.skus.find( function (e) {
                return e.available == true && e.sku == sku;
            })
        }

        return false;
    }

    function _getFirstAvailableSkuVTEX () {
        if (skuJson && 'skus' in skuJson && skuJson.skus.length) {
            let t = skuJson.skus.find( function (e) {
                return e.available == true;
            })

            return t ? t.sku : null;
        }

        return null;
    }

    function _trackVTEX(sku)
    {
        try {
            if (!sku) {
                return;
            }

            let skuData = getSkuData(sku);

            if (skuData && WU._trackProductVTEXField in skuData && skuData[WU._trackProductVTEXField]) {
                let _sku = skuData[WU._trackProductVTEXField];

                if (_sku && WU._vtexUniqueSkus.indexOf(_sku) == -1) {
                    WU._metadata.sku = _sku;
                    WU._vtexUniqueSkus.push(_sku);

                    _track(WU._publicKey, 'product-view', WU._metadata, WU._callback)
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    /**
     *  These function is call in the first view of the VTEX product's page
     */
    function _trackProductVTEX(publicKey, metadata, callback)
    {
        WU._publicKey = publicKey || WU._publicKey;
        WU._metadata = metadata || WU._metadata;
        WU._callback = callback || WU._callback;

        var waitForGetSkuData = setInterval(function () {
            if (typeof getSkuData != "undefined") {
                _trackVTEX(_getFirstAvailableSkuVTEX());
                clearInterval(waitForGetSkuData);
            }
        }, 50);
    }

    /**
     *  The listener handler for the sku change's event on variation changes of the principal product
     */
    function WoowUpVTEXTrackingSKUChangedHandler(e)
    {
        try {
            if (_isSkuAvailableVTEX(e.newSkuId)) {
                _trackVTEX(e.newSkuId);
            } else {
                console.info("[WU] The product " + e.newSkuId + " is not available");
            }
        } catch (err) {
            console.error(err)
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
    WU._trackProductVTEXField = 'reference';
    WU._publicKey = null;
    WU._metadata = {};
    WU._callback = undefined;

    window.WU = WU;

    if (_isVTEX()) {
        WU._vtexUniqueSkus = [];

        var waitForVTEX = setInterval(function () {
            if (typeof window.Vtex != "undefined") {
                _addVTEXListener('skuSelectionChanged', 'WoowUpVTEXTrackingSKUChanged', WoowUpVTEXTrackingSKUChangedHandler);
                clearInterval(waitForVTEX);
            }
        }, 50);
    }

    _getId()
    _getLastSession()
})();