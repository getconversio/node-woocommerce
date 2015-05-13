# node-woocommerce
Connects NodeJS to the glorious world of the WooCommerce API

[![Code Climate](https://codeclimate.com/repos/5551dd2f6956804225000037/badges/4935563d1fc24b707863/gpa.svg)](https://codeclimate.com/repos/5551dd2f6956804225000037/feed) [![Test Coverage](https://codeclimate.com/repos/5551dd2f6956804225000037/badges/4935563d1fc24b707863/coverage.svg)](https://codeclimate.com/repos/5551dd2f6956804225000037/coverage)

## Installation

To install the module using NPM:

```
npm install woocommerce --save
```

## Setup

You will need a consumer key and consumer secret to call your store's WooCommerce API. You can find instructions [here](http://docs.woothemes.com/document/woocommerce-rest-api/)

Include the 'woocommerce' module within your script and instantiate it with a config:

```javascript
var WooCommerce = require('woocommerce');

var wooCommerce = new WooCommerce({
  url: 'mystore.com',
  port: 443,
  ssl: true,
  consumerKey: 'ck_123456789abcd',
  secret: 'cs_abcdefg12345'
});
```

**Instantiating a WooCommerce instace without a url, consumerKey or secret will result in an error being thrown**

## Options

When instantiating the WooCommerce object you have a choice of the following configuration options:

| option      | type    | required | description                                                                                                                         |
|-------------|---------|----------|-------------------------------------------------------------------------------------------------------------------------------------|
| url         | string  | yes      | The url of your store without the protocol. e.g. mystore.com                                                                        |
| consumerKey | string  | yes      | The consumer key generated in the store admin                                                                                       |
| secret      | string  | yes      | The consumer secret generated in the store admin                                                                                    |
| ssl         | boolean | no       | (default: false) If your API is on HTTPS set ssl to true. HTTP: false                                                               |
| port        | number  | no       | (default: 80) Set the port to use for all calls, HTTPS: 443 normally, so if you have ssl:true you should change this option to 443. |
| logLevel    | number  | no       | (default: 0) 0 shows errors only, 1 shows info and errors for debugging                                                             |
| apiPath     | string  | no       | (default: '/wc-api/v2') The path to your API, it should contain a leading slash and no trailing slash                               |

## Calling the API

Your WooCommerce API can be called once the WooCommerce object has been instantiated (see above).

### GET

Assuming you have already [instantiated](#setup).

```javascript
wooCommerce.get('/products', function(err, data, res){
  // err will return any errors that occur
  // data will contain the body content from the request
  // res is the full response object, use this to get headers etc
});
```

### POST

Assuming you have already [instantiated](#setup) and for this example you have a [coupon object](http://woothemes.github.io/woocommerce-rest-api-docs/#create-a-coupon).

```javascript
wooCommerce.post('/coupons', couponObject, function(err, data, res){
  // err will return any errors that occur
  // data will contain the body content from the request
  // res is the full response object, use this to get headers etc
});
```

### PUT

Assuming you have already [instantiated](#setup).

```javascript
var couponUpdate = {
  amount: 5
};

wooCommerce.put('/coupons/1234', couponUpdate, function(err, data, res){
  // err will return any errors that occur
  // data will contain the body content from the request
  // res is the full response object, use this to get headers etc
});
```

### DELETE

Assuming you have already [instantiated](#setup).

```javascript
wooCommerce.delete('/coupons/1234', function(err, data, res){
  // err will return any errors that occur
  // data will contain the body content from the request
  // res is the full response object, use this to get headers etc
});
```

## Testing

```
npm test
```

## Contributing

This module was originally written to be used with [Receiptful](https://receiptful.com) and is used in a production environment currently. This will ensure that this module is well maintained, bug free and as up to date as possible.

Receiptful's developers will continue to make updates as often as required to have a consistently bug free platform, but we are happy to review any feature requests or issues and are accepting constructive pull requests.
