# Web-Tracking

    <script src="https://assets-cdn.woowup.com/js/webtracking.min.js" type="text/javascript"></script>
    <script type="text/javascript">
        // Optional config, you can change these parameters:
        WU.config = {
            identifier: 'wuid', // default 'wuid', customer parameter identifier (optional),
            sessionDuration: 3600 // default 3600 seconds (optional)
        }
        // To track events use WU.track function
        // WU.track(KEY, EVENT_NAME, METADATA, CALLBACK)
        // @param {KEY} is your account's public key
        // @param {EVENT_NAME} one of ['product-view', 'category-view']
        // @param {METADATA} some additional information about the event, for example the product's sku or the category's url
        // @param {CALLBACK} a function to call after the request ended successfully
        // tracking product's visit: SKU field is required in the metadata
        WU.track('XXXXX', 'product-view', { sku: 'AAABBBCCC111' });
        // tracking category's visit: PATH and URL fields are required in the metadata
        WU.track('XXXXX', 'category-view', { 
            path: '/televisores/4k/50',
            url: 'http://www.example.com/televisores/4k/50'
        });
    </script>
